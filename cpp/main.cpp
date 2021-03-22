#include <emscripten/bind.h>

#include <unordered_map>

using namespace emscripten;

typedef enum
{
   NoError = 0,
   InvalidInstrument = -1,
   InvalidReplayedInstrument = -2,
   InvalidSampleRate = -3,
   InvalidNote = -4,
   DataAfterError = -5,
   EndDataAfterError = -6,
   NotePendingError = -7,
   NoNoteToRelease = -8,
   NoteAfterRelease = -9,
   NoteAlreadyReleaser = -10,
} Error_t;

class Note
{
   public:

      Note()
      {
         channel_1_data = NULL;
         channel_2_data = NULL;
         nb_samples = 0;
      }
      Note(int size, float* channel_1, float* channel_2)
      {
         /* Decode BASE64 */
         channel_1_data = channel_1;
         channel_2_data = channel_2;
         nb_samples = size;
      }

      float GetLeft(int sample)
      {
         if (sample < nb_samples) return channel_1_data[sample];
         return 0.0;
      }
      float GetRight(int sample)
      {
         if (sample < nb_samples) return channel_2_data[sample];
         return 0.0;
      }

   private:

      int nb_samples;
      float* channel_1_data;
      float* channel_2_data;
};

class Instrument
{
   public:

      void LoadNote(int note, int size, float* channel_1, float* channel_2)
      {
         notes[note] = new Note(size, channel_1, channel_2);
      }

      Note* GetNote(int note)
      {

         return notes[note];
      }

   private:

      std::unordered_map<int, Note*> notes;
};

class PlayedNote
{
   public:

      PlayedNote()
      {}

      bool SampleData(std::vector<float>& data, Note* note, float volume)
      {
         /* Compute effective length */
         int length = data.size() / 2;

         /* Parse all triggers */
         std::vector<TriggerInfo_t> remaining_triggers;
         for (TriggerInfo_t& value: triggers)
         {
            /* Compute applicable borns */
            int from = value.from;
            int to = value.to;
            if ((to == 0) || (to > length)) to = length;

            /* Apply it */
            for (int i = from; i < to; i++)
            {
               data[i] += note->GetLeft(value.play_index)*value.volume*volume;
               data[length+i] += note->GetRight(value.play_index)*value.volume*volume;

               value.play_index++;
            }

            /* check if we keep the data */
            if ((value.to == 0) || (value.to > length))
            {
               /* Recompute new borns */
               if (value.from > length) value.from -= length;
               else value.from = 0;

               if (value.to > 0) value.to -= length;

               /* re-export it */
               remaining_triggers.push_back(value);
            }
         }

         /* Check if we still have something to play */
         if (remaining_triggers.empty()) return true;

         /* update data */
         triggers = remaining_triggers;
         return false;
      }

      int Trigger(int offset, float volume)
      {
         /* Check that we have no pending note, and that we trigger after all scheduled ones */
         for(TriggerInfo_t& value: triggers)
         {
            if (value.from >= offset) return DataAfterError;
            if (value.to == 0) return NotePendingError;
            if (value.to > offset) return EndDataAfterError;
         }

         /* Append it */
         TriggerInfo_t value;
         value.from = offset;
         value.to = 0;
         value.volume = volume;
         value.play_index = 0;
         triggers.push_back(value);
         return NoError;
      }

      int Release(int offset)
      {
         if (triggers.empty())
         {
            return NoNoteToRelease;
         }
         if (triggers.back().from >= offset)
         {
            return NoteAfterRelease;
         }
         if (triggers.back().to != 0)
         {
            return NoteAlreadyReleaser;
         }
         triggers.back().to = offset;
         return NoError;
      }

   private:

      typedef struct
      {
         int from;
         int to;
         int play_index;
         float volume;
      } TriggerInfo_t;

      std::vector<TriggerInfo_t> triggers;
};

class ReplayedInstrument
{
   public:

      ReplayedInstrument(Instrument* instrument)
      {
         this->instrument = instrument;
         this->volume = 1.0;
      }

      void SampleData(std::vector<float>& data)
      {
         std::vector<int> to_suppress;

         for (auto kv : played_notes)
         {
            if (kv.second.SampleData(data, instrument->GetNote(kv.first), this->volume))
            {
               to_suppress.push_back(kv.first);
            }
         }

         for (auto key: to_suppress)
         {
            played_notes.erase(key);
         }
      }

      int SetVolume(float volume)
      {
         this->volume = volume;
         if (this->volume > 1.0) this->volume = 1.0;
         if (this->volume < 0.0) this->volume = 0.0;
         return NoError;
      }

      int SetInstrument(Instrument* instrument)
      {
         this->instrument = instrument;
         return NoError;
      }

      int TriggerNote(int note, int offset, float volume)
      {
         /* Check if note is present */
         if (played_notes.find(note) == played_notes.end())
         {
            played_notes[note] = PlayedNote();
         }

         /* Append the trigger */
         return played_notes[note].Trigger(offset, volume);
      }

      int ReleaseNote(int note, int offset)
      {
         /* Check if note is present */
         if (played_notes.find(note) == played_notes.end())
         {
            return InvalidNote;
         }

         /* Append the trigger */
         return played_notes[note].Release(offset);
      }

      int ReleaseAllNotes()
      {
         played_notes.clear();
         return NoError;
      }

      const std::vector<int>& GetNotesTriggered()
      {
         cache_vector.clear();
         for (auto kv : played_notes)
         {
            cache_vector.push_back(kv.first);
         }
         return cache_vector;
      }

   private:

      Instrument* instrument;

      float volume;

      std::unordered_map<int, PlayedNote> played_notes;

      std::vector<int> cache_vector;
};

class Syntethizer
{
   public:

      Syntethizer()
      {
         sample_rate = 0;
         last_replayed_instrument_id = 0;
      }

      int TriggerNote(int replay_instrument_id, int note, int offset, float volume)
      {
         /* Check if replayed instrument exists */
         if (replayed_instruments.find(replay_instrument_id) == replayed_instruments.end())
         {
            return InvalidReplayedInstrument;
         }

         /* Trigger the note */
         return replayed_instruments[replay_instrument_id]->TriggerNote(note, offset, volume);
      }

      int ReleaseNote(int replay_instrument_id, int note, int offset)
      {
         /* Check if replayed instrument exists */
         if (replayed_instruments.find(replay_instrument_id) == replayed_instruments.end())
         {
            return InvalidReplayedInstrument;
         }

         /* Release the note */
         return replayed_instruments[replay_instrument_id]->ReleaseNote(note, offset);
      }

      int ReleaseAllNotes(int replay_instrument_id)
      {
         /* Check if replayed instrument exists */
         if (replayed_instruments.find(replay_instrument_id) == replayed_instruments.end())
         {
            return InvalidReplayedInstrument;
         }
         return replayed_instruments[replay_instrument_id]->ReleaseAllNotes();
      }

      int AddReplayInstrument(int instrument_id)
      {
         /* Check if instrument exists */
         if (instruments.find(instrument_id) == instruments.end())
         {
            return InvalidInstrument;
         }

         /* Insert replay */
         last_replayed_instrument_id++;
         replayed_instruments[last_replayed_instrument_id] = new ReplayedInstrument(instruments[instrument_id]);
         return last_replayed_instrument_id;
      }

      const std::vector<int>& GetNotesTriggered(int replay_instrument_id)
      {
         /* Check if instrument exists */
         if (replayed_instruments.find(replay_instrument_id) == replayed_instruments.end())
         {
            cache_vector.clear();
            return cache_vector;
         }

         /* Provide info */
         return replayed_instruments[replay_instrument_id]->GetNotesTriggered();
      }

      const std::vector<int>& GetReplayedInstruments()
      {
         cache_vector.clear();
         for (auto kv : replayed_instruments)
         {
            cache_vector.push_back(kv.first);
         }
         return cache_vector;
      }

      void SampleData(std::vector<float>& data)
      {
         for (auto kv : replayed_instruments)
         {
            kv.second->SampleData(data);
         }
      }

      int ClearAll()
      {
         for (auto kv : replayed_instruments)
         {
            delete kv.second;
         }
         replayed_instruments.clear();
         return NoError;
      }

      int SetReplayedInstrumentVolume(int replay_instrument_id, float volume)
      {
         /* Check if replayed instrument exists */
         if (replayed_instruments.find(replay_instrument_id) == replayed_instruments.end())
         {
            return InvalidReplayedInstrument;
         }

         /* Change volume */
         return replayed_instruments[replay_instrument_id]->SetVolume(volume);
      }

      int SetReplayedInstrumentInstrument(int replay_instrument_id, int instrument_id)
      {
         /* Check if replayed instrument exists */
         if (replayed_instruments.find(replay_instrument_id) == replayed_instruments.end())
         {
            return InvalidReplayedInstrument;
         }

         /* Check if instrument exists */
         if (instruments.find(instrument_id) == instruments.end())
         {
            return InvalidInstrument;
         }

         /* Assign instrument */
         return replayed_instruments[replay_instrument_id]->SetInstrument(instruments[instrument_id]);
      }

      int LoadNote(int instrument_id, int note, int sample_rate, int size, float* channel_data, float* channe2_data)
      {
         /* Assign sample rate */
         if (this->sample_rate == 0)
         {
            this->sample_rate = sample_rate;
         }

         /* Check mix of sample rates */
         if (this->sample_rate != sample_rate)
         {
            /* We do not accept a mix of sample rates */
            return InvalidSampleRate;
         }

         /* Load the instrument */
         Instrument* instrument = NULL;
         std::unordered_map<int, Instrument*>::const_iterator got = instruments.find(instrument_id);
         if ( got == instruments.end() )
         {
            instrument = new Instrument();
            instruments[instrument_id] = instrument;
         }
         else
         {
            instrument = got->second;
         }

         instrument->LoadNote(note, size, channel_data, channe2_data);
         return NoError;
      }

   private:

      std::unordered_map<int, Instrument*> instruments;
      std::unordered_map<int, ReplayedInstrument*> replayed_instruments;

      int sample_rate;

      int last_replayed_instrument_id;
      std::vector<int> cache_vector;
};

static Syntethizer syntethizer;

void start_stop_note(int instrument_id, std::string note, float volume, float from_time, float to_time);

void start_note();

extern "C"
{
   int LoadNote(int instrument_id, int note, int sample_rate, int size, float* channel_data, float* channe2_data)
   {
      return syntethizer.LoadNote(instrument_id, note, sample_rate, size, channel_data, channe2_data);
   }

   int AddReplayInstrument(int instrument_id)
   {
      return syntethizer.AddReplayInstrument(instrument_id);
   }

   int* GetReplayedInstruments(int* nb_instruments)
   {
      const std::vector<int>& instruments = syntethizer.GetReplayedInstruments();
      *nb_instruments = instruments.size();
      if (*nb_instruments > 0)
      {
         return (int*)&instruments[0];
      }
      else
      {
         return NULL;
      }
   }

   int ClearAll()
   {
      return syntethizer.ClearAll();
   }

   int SetReplayedInstrumentVolume(int replay_instrument_id, float volume)
   {
      return syntethizer.SetReplayedInstrumentVolume(replay_instrument_id, volume);
   }

   int SetReplayedInstrumentInstrument(int replay_instrument_id, int instrument_id)
   {
      return syntethizer.SetReplayedInstrumentInstrument(replay_instrument_id, instrument_id);
   }

   int TriggerNote(int replay_instrument_id, int note, int offset, float volume)
   {
      return syntethizer.TriggerNote(replay_instrument_id, note, offset, volume);
   }

   int ReleaseNote(int replay_instrument_id, int note, int offset)
   {
      return syntethizer.ReleaseNote(replay_instrument_id, note, offset);
   }

   int ReleaseAllNotes(int replay_instrument_id)
   {
      return syntethizer.ReleaseAllNotes(replay_instrument_id);
   }

   int* GetNotesTriggered(int replay_instrument_id, int* nb_notes)
   {
      const std::vector<int>& notes = syntethizer.GetNotesTriggered(replay_instrument_id);
      *nb_notes = notes.size();
      if (*nb_notes > 0)
      {
         return (int*)&notes[0];
      }
      else
      {
         return NULL;
      }
   }

   float* SampleData(int length)
   {
      /* Initialise static vector*/
      static std::vector<float> data;

      /* Set it to full zero*/
      data = std::vector<float>(length*2, 0.0);

      /* Perform sampling */
      syntethizer.SampleData(data);

      return &data[0];
   }
}

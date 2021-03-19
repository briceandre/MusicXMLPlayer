#include <emscripten/bind.h>

using namespace emscripten;

extern "C"
{
   int toto(int a, int b)
   {
      return a*b;
   }
}

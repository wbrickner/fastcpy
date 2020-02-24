#include <stdlib.h>
#include "config.h"

float destination_buffer[DESTINATION_BUFFER_SIZE] = {};

void fastcpy(float* input_buffer, const size_t length) {
	#ifdef USE_MEMCPY
		memcpy(
			(void *)destination_buffer, 
			(const void*)input_buffer,
			length * sizeof(float)			// remember these are /bytes/ we copy, not elements!
		);
	#else
		// use a simple loop, which due to alignment can be automatically vectorized
		for (unsigned int j = 0; j < length; j++) {
			destination_buffer[j] = input_buffer[j];
		}
	#endif
}


int main(int argc, char* argv[]) {
  // allocate input buffer
  float* input_buffer;
  posix_memalign(
    (void**) &input_buffer, 
    (size_t) 16, 
    (size_t) SOURCE_BUFFER_SIZE * sizeof(float)  // calculate how many /bytes/ to allocate
  );

  // perform trials
  for (unsigned int j = 0; j < TRIALS; j++) {
    fastcpy(input_buffer, SOURCE_BUFFER_SIZE);
  }

  // free input buffer
  free(input_buffer);
  return 0;
}
#include <time.h>
#include <stdlib.h>
#include <stdio.h>
#include "config.h"
#ifdef USE_MEMCPY
#include <string.h>
#endif

float destination_buffer[DESTINATION_BUFFER_SIZE] = {};

void fastcpy(float* input_buffer, const size_t length) {
	#ifdef USE_MEMCPY
		memcpy(
			(void *)destination_buffer, 
			(const void*)input_buffer,
			length * sizeof(float)			// these are /bytes/ we copy, not elements!
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


  // seed and supply random input data
  srand(time(NULL));
  for (unsigned int j = 0; j < SOURCE_BUFFER_SIZE; j++) {
    input_buffer[j] = (float)rand();
  }

  // perform trials
  clock_t start, stop;
  start = clock();
  for (unsigned int j = 0; j < TRIALS; j++) {
    fastcpy(input_buffer, SOURCE_BUFFER_SIZE);
  }
  stop = clock();
  float elapsedTime = (float)(stop - start) / (float)CLOCKS_PER_SEC;

  // print time
  printf("%f\n", elapsedTime);

  // free input buffer
  free(input_buffer);
  return 0;
}

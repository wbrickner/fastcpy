#include <stddef.h>

void fastcpy(char* destination_buffer, const char* input_buffer, const size_t bytes) {
  for (size_t j = 0; j < bytes; ++j) {
    destination_buffer[j] = input_buffer[j];
  }
}
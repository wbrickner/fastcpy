driver:	$(find ./ -type f)
	@gcc -O3 -march=native ./copy_bench.c -o ./copy_bench

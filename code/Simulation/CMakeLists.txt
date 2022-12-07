# CMakeList.txt : CMake project for CSSMALG, include source and define
# project specific logic here.
#
cmake_minimum_required (VERSION 3.23)
# set(CMAKE_C_COMPILER "nvcc")
# set(CMAKE_CXX_COMPILER "nvcc")
# set(JSON_BuildTests OFF CACHE INTERNAL "")

# project ("CSSMALG")
project ("CSSMALG" LANGUAGES CXX)

include_directories(include third_party/rapidjson/include)

add_subdirectory(third_party/json)

# find_package(CUDAToolkit REQUIRED)
# set(CMAKE_CUDA_ARCHITECTURES 75)

# find_package(OpenMP REQUIRED)

# Add source to this project's executable.
add_executable (CSSMALG "src/main.cpp"  "src/routing.cpp" "src/update.cpp" "src/io.cpp" "src/utils.cpp" "src/base64.cpp")
add_executable (PrecalcSPT "src/PrecalculateSPT.cpp"  "src/routing.cpp" "src/update.cpp" "src/io.cpp" "src/utils.cpp" "src/fastFW.cu"  "src/base64.cpp")

# target_link_libraries(CSSMALG PRIVATE CUDA::cudart)
# target_link_libraries(PrecalcSPT PRIVATE CUDA::cudart)

# target_compile_options(CSSMALG PUBLIC ${OpenMP_CXX_FLAGS})
# target_link_libraries(CSSMALG PRIVATE ${OpenMP_CXX_LIBRARIES})

# target_compile_options(PrecalcSPT PUBLIC ${OpenMP_CXX_FLAGS})
# target_link_libraries(PrecalcSPT PRIVATE ${OpenMP_CXX_LIBRARIES})

set_property(TARGET CSSMALG PROPERTY CXX_STANDARD 20)
set_property(TARGET PrecalcSPT PROPERTY CXX_STANDARD 20)


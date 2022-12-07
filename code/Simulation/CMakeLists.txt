# CMakeList.txt : CMake project for CSSMALG, include source and define
# project specific logic here.
#
cmake_minimum_required (VERSION 3.23)
# set(CMAKE_C_COMPILER "nvcc")
# set(CMAKE_CXX_COMPILER "nvcc")
set(JSON_BuildTests OFF CACHE INTERNAL "")

# project ("CSSMALG")
project ("CSSMALG" LANGUAGES CXX CUDA)

include_directories("include")

add_subdirectory(third_party/json)

find_package(CUDAToolkit REQUIRED)
set(CMAKE_CUDA_ARCHITECTURES 75)

find_package(OpenMP REQUIRED)

# Add source to this project's executable.
add_executable (Visualize "src/main.cpp"  "src/routing.cpp" "src/update.cpp" "src/io.cpp" "src/utils.cpp" "src/fastFW.cu" "src/base64.cpp")
target_link_libraries(Visualize PRIVATE nlohmann_json::nlohmann_json)
target_link_libraries(Visualize PRIVATE CUDA::cudart)
#target_compile_options(Visualize PUBLIC ${OpenMP_CXX_FLAGS})
target_link_libraries(Visualize PRIVATE ${OpenMP_CXX_LIBRARIES})
set_property(TARGET Visualize PROPERTY CXX_STANDARD 20)




add_executable (PrecalcSPT "src/PrecalculateSPT.cpp"  "src/routing.cpp" "src/update.cpp" "src/io.cpp" "src/utils.cpp" "src/fastFW.cu"  "src/base64.cpp" src/GenerateAgents.cpp)
target_link_libraries(PrecalcSPT PRIVATE nlohmann_json::nlohmann_json)
target_link_libraries(PrecalcSPT PRIVATE CUDA::cudart)
#target_compile_options(PrecalcSPT PUBLIC ${OpenMP_CXX_FLAGS})
target_link_libraries(PrecalcSPT PRIVATE ${OpenMP_CXX_LIBRARIES})
set_property(TARGET PrecalcSPT PROPERTY CXX_STANDARD 20)




add_executable (Simulate "src/largeSim.cpp"  "src/routing.cpp" "src/update.cpp" "src/io.cpp" "src/utils.cpp"  "src/base64.cpp")
target_link_libraries(Simulate PRIVATE nlohmann_json::nlohmann_json)
target_link_libraries(Simulate PRIVATE CUDA::cudart)
target_compile_options(Simulate PUBLIC ${OpenMP_CXX_FLAGS})
target_link_libraries(Simulate PRIVATE ${OpenMP_CXX_LIBRARIES})
set_property(TARGET Simulate PROPERTY CXX_STANDARD 20)

add_executable (GenerateAgents "src/GenerateAgents.cpp"  "src/routing.cpp" "src/update.cpp" "src/io.cpp" "src/utils.cpp"  "src/base64.cpp")
target_link_libraries(GenerateAgents PRIVATE nlohmann_json::nlohmann_json)
target_link_libraries(GenerateAgents PRIVATE CUDA::cudart)
target_compile_options(GenerateAgents PUBLIC ${OpenMP_CXX_FLAGS})
target_link_libraries(GenerateAgents PRIVATE ${OpenMP_CXX_LIBRARIES})
set_property(TARGET GenerateAgents PROPERTY CXX_STANDARD 20)







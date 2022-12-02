# CMakeList.txt : CMake project for CSSMALG, include source and define
# project specific logic here.
#
cmake_minimum_required (VERSION 3.12)

set(JSON_BuildTests OFF CACHE INTERNAL "")

project ("CSSMALG")

include_directories("include")

add_subdirectory(third_party/json)

# Add source to this project's executable.
add_executable (CSSMALG "src/main.cpp"  "src/routing.cpp" "src/update.cpp" "src/io.cpp" src/utils.cpp include/utils.hpp)
add_executable (PrecalcSPT "src/PrecalculateSPT.cpp"  "src/routing.cpp" "src/update.cpp" "src/io.cpp" src/utils.cpp)

target_link_libraries(CSSMALG PRIVATE nlohmann_json::nlohmann_json)
target_link_libraries(PrecalcSPT PRIVATE nlohmann_json::nlohmann_json)

set_property(TARGET CSSMALG PROPERTY CXX_STANDARD 20)
set_property(TARGET PrecalcSPT PROPERTY CXX_STANDARD 20)


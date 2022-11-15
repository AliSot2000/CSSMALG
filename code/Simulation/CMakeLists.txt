# CMakeList.txt : CMake project for CSSMALG, include source and define
# project specific logic here.
#
cmake_minimum_required (VERSION 3.12)

project ("CSSMALG")

include_directories("include")

# Add source to this project's executable.
add_executable (CSSMALG "src/main.cpp"  "src/routing.cpp" "src/update.cpp")

set_property(TARGET CSSMALG PROPERTY CXX_STANDARD 20)

# TODO: Add tests and install targets if needed.

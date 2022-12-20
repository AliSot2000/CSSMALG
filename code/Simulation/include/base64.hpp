//
// Created by alisot2000 on 05.12.22.
// Code inspired by: https://stackoverflow.com/questions/180947/base64-decode-snippet-in-c
//

#ifndef _BASE64_H_
#define _BASE64_H_

#include <vector>
#include <string>
typedef unsigned char BYTE;

/**

Encodes a byte array into a base64 string.
@param buf A pointer to the byte array to be encoded.
@param bufLen The length of the byte array.
@return A base64 encoded string.
*/
std::string base64_encode(BYTE const* buf, unsigned int bufLen);

/*
	Decode

	@param encoded_string String to decode

	@return Returns a std::vector<BYTE> containing the raw data
*/
std::vector<BYTE> base64_decode(std::string const& encoded_string);

/**

Encodes a large byte array into a base64 string.
@param buf A pointer to the byte array to be encoded.
@param bufLen The length of the byte array.
@param output A pointer to the output buffer where the encoded string will be stored.
@param outputLen The length of the output buffer.
*/
void Large_base64_encode(BYTE const* buf, unsigned int bufLen, char* output, unsigned int outputLen);
#endif


# UDC
The Universal Data Cube (udc) library is for modeling data sets
as data cubes and integrating them together. The udc has two kinds of elements:

 * 'universal elements' are shared by all data sets
 * 'local elements' are local to each data set

By establishing a relationship between local elements and universal elements, the
udc library is able to integrate many data sets together that may:

 * refer to the same entities using different identifiers, or
 * express the same numeric field using a different scale factor.

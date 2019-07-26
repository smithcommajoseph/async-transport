# Async Transport [![Build Status](https://secure.travis-ci.org/technicolorenvy/async-transport.png?branch=master)](http://travis-ci.org/technicolorenvy/async-transport)

AsyncTransport is a wrapper for the most excellent [await-to-js](https://github.com/scopsy/await-to-js) function. It provides support for 1 to n asyncronous functions, which may be executed in serial or parallel, and returns a predictable object for easy consumption.

## Pre-requisites
You need to use Node 7.6 (or later) or an ES7 transpiler in order to use async/await functionality. You can use babel or typescript for that.

## Install

```sh
npm i async-transport --save
```

or using yarn

```sh
yarn add async-transport
```

## Details 

The `asyncTransport` function takes two arguments
- `promiseCollection` - an array of functions, if a single fn is passed, it will be converted to an array with a single element.
- `options` - an object containing params that affect `asyncTransport`'s execution. Currently only the `strategy` param is supported (see more on this below in the usage examples).

Once all functions in the `promiseCollection` have either resolved or errored (or some combination of the two), an object is returned containing 3 props. These props are

- `hasErrors` - `true` if errors were detected, `false` otherwise
- `errors` - an array of errors organized in order in which the related functions were passed
- `data` - an array of data objects organized in order in which the related functions to were passed

## Usage 

### Basic (aww snap, you basic!)

```javascript
const asyncTransport = require('async-transport');

// mock async fns
let asyncThing1 = () => {
   let deferred = new Promise((resolve, reject) => {
     setTimeout(() => {
      resolve({ foo: 'bar' });
     }, 100)
   });
   return deferred;
}
let asyncThing2 = () => {
   let deferred = new Promise((resolve, reject) => {
     setTimeout(() => {
      resolve({ baz: 'boom' });
     }, 50)
   });
   return deferred;
}

// Working with promises via async/await
let foo = async () => {
    let theData = await asyncTransport([
        asyncThing1,
        asyncThing2
      ]
    );    
    console.log(theData);
}
foo();

// Above code logs the follwing object to the console
{
  hasErrors: false,
  errors: [ null, null ],
  data: [ { foo: 'bar' }, { baz: 'boom' } ]
}
```

### Other usage examples coming soon! In the meantime, please see the [tests](https://github.com/technicolorenvy/async-transport/blob/master/__tests__/async-transport.test.js) for more interesting use-cases and examples.

## License

MIT © Joseph Smith
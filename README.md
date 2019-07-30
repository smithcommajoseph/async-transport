# Async Transport 

[![NPM version][npm-image]][npm-url]
[![Travis Build][travis-image]][travis-url]

> Provides support for 1-n asynchronous, returning a predictable object for easy consumption.

## Contents
- [Pre-requisites](https://github.com/technicolorenvy/async-transport#pre-requisites)
- [Install](https://github.com/technicolorenvy/async-transport#install)
- [Why use asyncTransport?](https://github.com/technicolorenvy/async-transport#why-use-asynctransport)
- [Details](https://github.com/technicolorenvy/async-transport#details)
- [Usage Examples](https://github.com/technicolorenvy/async-transport#usage-examples)
  - [Basic](https://github.com/technicolorenvy/async-transport#basic-examples)
  - [Serial](https://github.com/technicolorenvy/async-transport#serial-execution-examples)
  - [Serial w/ data](https://github.com/technicolorenvy/async-transport#data-dependent-serial-execution-examples)
- [License](https://github.com/technicolorenvy/async-transport#license)

## Pre-requisites
You need to use Node 7.6 (or later) or an ES7 transpiler to use async/await functionality. You can use babel or typescript for that.

## Install

```sh
npm i async-transport --save
```

or using yarn

```sh
yarn add async-transport
```

## Why use asyncTransport?
ES7 async/await allows us to write asynchronous code in a style that _looks_ synchronous. This is great, but under the hood, it is crucial to remember that we are still effectively dealing with [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). When implementing error handling inside Promises developers commonly use a try/catch approach like the following. 

```javascript
async function asyncTask(cb) {
  try {
    const user = await UserModel.findById(1);
    if(!user) return cb('No user found');
  } catch(e) {
    return cb('Unexpected error occurred');
  }

  try {
    const savedTask = await TaskModel({userId: user.id, name: 'Demo Task'});
  } catch(e) {
    return cb('Error occurred while saving task');
  }

  if(user.notificationsEnabled) {
    try {
      await NotificationService.sendNotification(user.id, 'Task Created');  
    } catch(e) {
      return cb('Error while sending notification');
    }
  }

  if(savedTask.assignedUser.id !== user.id) {
    try {
      await NotificationService.sendNotification(savedTask.assignedUser.id, 'Task was created for you');
    } catch(e) {
      return cb('Error while sending notification');
    }
  }

  cb(null, savedTask);
}
```

This becomes onerous, for example, when writing API endpoints that assemble data from multiple sources and may quickly become hard to read (and maintain). When researching ways to remedy this, I found [this Medium blog entry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) written by Dima Grossman and began using the resulting [await-to-js](https://github.com/scopsy/await-to-js) package. This yielded code like so.

```javascript
import to from 'await-to-js';

async function asyncTask() {
  let err, user, savedTask;

  [err, user] = await to(UserModel.findById(1));
  if(!user) throw new CustomerError('No user found');

  [err, savedTask] = await to(TaskModel({userId: user.id, name: 'Demo Task'}));
  if(err) throw new CustomError('Error occurred while saving task');

  if(user.notificationsEnabled) {
    const [err] = await to(NotificationService.sendNotification(user.id, 'Task Created'));  
    if (err) console.error('Just log the error and continue flow');
  }
}
```

This was an improvement, but still did not fully meet my needs. In more complex use-cases, one still needed to manage and track multiple arrays as a result of wrapping async code in `to` method calls. 

What if we could utilize a single method to handle the execution of 1-n async functions, using `to` behind the scenes to keep things cleanly organized `asyncTransport` was my answer to this question.

Utilizing `asyncTransport`, the above code may be further simplified like so.

```javascript
import asyncTransport from 'async-transport';

async function asyncTask() {
  let result = await asyncTransport([ 
    UserModel.findById(1),
    TaskModel({userId: user.id, name: 'Demo Task'}),
    NotificationService.sendNotification(user.id, 'Task Created')
  ]);    

  // Print (or throw) errors by iterating over the errors collection
  if (result.hasErrors) {
    for (let i = 0; i < result.errors.length; i++) {
      if (result.errors[i]) { console.log(result.errors[i]); }
    }
  // Otherwise do stuff with the result data
  } else {
    console.log(result.data);
  }
}
```

Using this approach, we only have to track one variable, `result`, which will reliably contain three properties, `hasErrors`, `errors`, and `data`. 

`errors` and `data` are parallel arrays, both of which maintain the order of the functions provided. In other words, executing `asyncTransport([fn1, fn2, fn3])` will return an object whose `errors` contain `[errors-from-fn1, errors-from-fn2, errors-from-fn3]` as well as a `data` array that contains `[data-from-fn1, data-from-fn2, data-from-fn3]`.

## Details 

The `asyncTransport` function takes two arguments
- `promiseCollection` - an array of functions, if a single fn is passed, it will be converted to an array with a single element.
- `options` - an object containing params that affect `asyncTransport`'s execution. Currently only the `strategy` param is supported (see more on this below in the usage examples).

Once all functions in the `promiseCollection` have either resolved or errored (or some combination of the two), an object is returned containing 3 props. These props are

- `hasErrors` - `true` if errors were detected, `false` otherwise
- `errors` - an array of errors organized in the order in which the related functions were passed
- `data` - an array of data objects organized in the order in which the related functions to were passed

## Usage Examples
While these examples are clearly trivial and fabricated, they should clearly demonstrate how `asyncTransport` may be integrated into your work-flow.

### Basic Examples

If you are concerned with only one async fn, you could write something like the following.

```javascript
const asyncTransport = require('async-transport');

// One mock async fn
let asyncThing1 = () => {
   let deferred = new Promise((resolve, reject) => {
     setTimeout(() => {
      resolve({ foo: 'bar' });
     }, 100)
   });
   return deferred;
}

// Working with promises via async/await
let foo = async () => {
  let theData = await asyncTransport(asyncThing1);    
  console.log(theData);
}

foo();

// The above code logs the following object to the console
{
  hasErrors: false,
  errors: [ null ],
  data: [ { foo: 'bar' } ]
}
```

If you have multiple async fns simply pass an array to `asyncTransport` like so.

```javascript
const asyncTransport = require('async-transport');

// Two mock async fns
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
    let theData = await asyncTransport([ asyncThing1, asyncThing2 ]);    
    console.log(theData);
}

foo();

// Above code logs the following object to the console
{
  hasErrors: false,
  errors: [ null, null ],
  data: [ { foo: 'bar' }, { baz: 'boom' } ]
}
```

## Serial Execution Examples

By default, `asyncTransport` will execute async fns passed to it (nearly) simultaneously and items will resolve in whatever order they resolve. 

If each function relies on the previous fn to have successfully resolved, you can pass a second parameter to `asyncTransport` to enforce serial execution of async functions. Let's modify our example above to see how we do this.

```javascript
const asyncTransport = require('async-transport');

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

let foo = async () => {
  let theData = await asyncTransport([ 
      asyncThing1, 
      asyncThing2
    ],
    {strategy: 'serial'} // Ensures fns resolve in the order they are passed
  );    
  console.log(theData);
}

foo();

// Above code still logs the following object to the console, but
// output in this case is identical to the `parallel` strategy
{
  hasErrors: false,
  errors: [ null, null ],
  data: [ { foo: 'bar' }, { baz: 'boom' } ]
}
```

## Data Dependent Serial Execution Examples

In addition to guaranteed order of execution, `asyncTransport` also provides a way to pass results from prior async function calls to subsequent functions as arguments. Consider the following.

```javascript
const asyncTransport = require('async-transport');

let asyncThing3 = () => {
  let deferred = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        val: 4
      });
     }, 75)
   });
   return deferred;
}

// args parameter is the data object returned from the prior async fn
let asyncThing4 = (args) => {
   let deferred = new Promise((resolve, reject) => {
     setTimeout(() => {
      resolve({
        val: args.val * 2 // multiply 4 * 2 (see execution below)
      });
     }, 20)
   });
   return deferred;
}

let foo = async () => {
  let theData = await asyncTransport([
      asyncThing3,
      asyncThing4
    ],
    {strategy: 'serial'}
  );
  console.log(theData);
}

foo();

// Above code still logs the following object to the console
  {
    hasErrors: false,
    errors: [ null, null ],
    data: [ { val: 4 }, { val: 8 } ]
  }
```

Given the above, _ideally_ one should add safeguards - like checking that `args` and any keys you plan on using in your fn actually exist - but as written, it should be adequate to illustrate the process.


## License

MIT © Joseph (Jos) Smith

[npm-url]: https://npmjs.org/package/async-transport
[npm-image]: https://img.shields.io/npm/v/async-transport.svg?style=flat-square

[travis-url]: https://travis-ci.org/technicolorenvy/async-transport
[travis-image]: https://img.shields.io/travis/technicolorenvy/async-transport.svg?style=flat-square
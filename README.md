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

## License

MIT © Joseph Smith
const to = require('await-to-js').default;

/*
 * Takes a promiseCollection as an arg and will chain each fn in that collection
 * passing the results of the prevFn to the currentFn wrapped by a Promise
 * @see https://stackoverflow.com/questions/30823653/is-node-js-native-promise-all-processing-in-parallel-or-sequentially
 * @param {array} promiseCollection - an array of fns, where each fn returns a promise
 * @return {object}
 */
let processSerial = (promiseCollection) => {
  return new Promise((resolve, reject) => {
    let resArr = [];
    promiseCollection
      // chain fns together
      .reduce((acc, fn) => acc.then((res) => {
        let args = undefined;
        if (res) {
          resArr.push(res);
          args = res[1];
        }
        return to(fn(args))
      }), Promise.resolve())
      // handle the last element w/ one last .then and resolve the promise
      .then((res) => {
        if (res) { resArr.push(res); }
        resolve(resArr);
      })
      // catch the errors if they occur and reject the promise
      .catch(() => {
        resArr.push(['serial fetch failure', null]);
        reject(resArr)
      });
  });
};


/**
 * asyncTransport fn
 * takes either a single promise fn or array of promise fns
 * and returns a promise that will resolve containing an object
 * with 3 props, `hasErrors`, `errors`, and `data`
 * @function
 * @param {array} promiseCollection - an array of promises or fns that return promises
 * @param {object=} opts - options
 * @param {object=} opts.strategy - currently supports "parallel" or "serial", default is "parallel"
 * if "serial" is chosen and functions have been passed (NOT Promises) each fn will be passed the
 * results of the previous fn in the collection
 *
 * @example
 * // See tests for more in-depth examples
 * const { asyncTransport } = require('asyncTransport');
 *
 * // create some stubbed async fns
 * let asyncThing1 = (args) => {
 *    let deferred = new Promise((resolve, reject) => {
 *      setTimeout(() => {
 *       resolve({
 *         foo: 'bar'
 *       });
 *      }, 100)
 *    });
 *    return deferred;
 * }
 *
 * let asyncThing2 = (args) => {
 *    let deferred = new Promise((resolve, reject) => {
 *      setTimeout(() => {
 *       resolve({
 *         baz: 'boom'
 *       });
 *      }, 50)
 *    });
 *    return deferred;
 * }
 *
 * let someFunction = async () => {
 *   let theData = await asyncTransport(asyncThing1, asyncThing2); // ⇨ {
 *                                                                        hasErrors: false,
 *                                                                        errors: [],
 *                                                                        data: [{ foo: 'bar' }, { baz: 'boom' }],
 *                                                                      }
 * }
 *
 * // someFunction gets executed at some point...
 *
 * @return {object}
 */
let asyncTransport = async (promiseCollection, opts) => {
  const DEFAULT_STRATEGY = "parallel";

  let resArr = [],
      retVal = {},
      hasErrors = false,
      errors = [],
      data = [],
      strategy = DEFAULT_STRATEGY;

  let tmpErr, tmpArr; //our throwaway vars

  if (opts && opts.strategy) {
    strategy = opts.strategy;
  }

  // ensure promiseCollection is an Array
  // TODO: we should explore if calling a single fn w/ Promise.all has any
  // meaningful impact on performance.
  if (!Array.isArray(promiseCollection)) {
    promiseCollection = [promiseCollection];
  }

  // ensure we are working with FUNCTIONS that return Promises
  promiseCollection = promiseCollection.map(fn => {
    if (fn.constructor == Promise) {
      let _promise = fn;
      fn = () => { return _promise };
    }
    return fn;
  });

  // handle the promiseCollection differently based on stategy
  switch(strategy) {
    case "serial":
      [tmpErr, tmpArr] = await to(processSerial(promiseCollection));
      if (tmpErr) {
        resArr = tmpErr;
      } else {
        resArr = tmpArr;
      }
      break;
    case "parallel":
    default:
      promiseCollection = promiseCollection.map((fn,i) => {
        resArr.push([null, null]);
        return to(fn());
      });
      resArr = await Promise.all(promiseCollection);
      break;
  }

  // format results
  for (let arr of resArr) {
    if (arr[0]) {
      hasErrors = true;
    }
    errors.push(arr[0]);
    data.push(arr[1]);
  }

  retVal = {
    hasErrors,
    errors,
    data,
  };

  return retVal;
}

module.exports = asyncTransport;
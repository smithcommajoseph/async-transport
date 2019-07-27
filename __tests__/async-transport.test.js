const expect = require('chai').expect;
const asyncTransport = require('../index.js');

// mock async fns
let asyncThing1 = (args) => {
   let deferred = new Promise((resolve, reject) => {
     setTimeout(() => {
      resolve({
        foo: 'bar'
      });
     }, 100)
   });
   return deferred;
}

let asyncThing2 = (args) => {
   let deferred = new Promise((resolve, reject) => {
     setTimeout(() => {
      resolve({
        baz: 'boom'
      });
     }, 50)
   });
   return deferred;
}

let asyncThing3 = (args) => {
   let deferred = new Promise((resolve, reject) => {
     setTimeout(() => {
      resolve({
        val: 4
      });
     }, 75)
   });
   return deferred;
}

let asyncThing4 = (args) => {
   let deferred = new Promise((resolve, reject) => {
     setTimeout(() => {
      resolve({
        val: args.val * 2
      });
     }, 20)
   });
   return deferred;
}

let asyncThingFail = () => {
   let deferred = new Promise((resolve, reject) => {
     setTimeout(() => {
      reject('Oh Noes!');
     }, 50)
   });
   return deferred;
}

describe('AsyncTransport', () => {

  //
  // Function tests
  it('works with a single fn whose Promise resolves', async () => {
    let theData = await asyncTransport(asyncThing1);

    expect(theData.hasErrors).to.equal(false);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.be.null;

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.deep.equal({ foo: 'bar' });
  });

  it('works with a single fn whose Promise is rejected', async () => {
    let theData = await asyncTransport(asyncThingFail);

    expect(theData.hasErrors).to.equal(true);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.equal('Oh Noes!');

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.be.undefined;
  });

  it('works with multiple parallel fns whose Promises all resolve', async () => {
    let theData = await asyncTransport([
        asyncThing1,
        asyncThing2
      ]
    );

    expect(theData.hasErrors).to.equal(false);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.be.null;
    expect(theData.errors[1]).to.be.null;

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.deep.equal({ foo: 'bar' });
    expect(theData.data[1]).to.deep.equal({ baz: 'boom' });
  });

  it('works with multiple parallel fns when n Promises are rejected', async () => {
    let theData = await asyncTransport([
        asyncThingFail,
        asyncThing1,
        asyncThingFail
      ]
    );

    expect(theData.hasErrors).to.equal(true);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.equal('Oh Noes!');
    expect(theData.errors[1]).to.be.null;
    expect(theData.errors[2]).to.equal('Oh Noes!');

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.be.undefined;
    expect(theData.data[1]).to.deep.equal({ foo: 'bar' });
    expect(theData.data[2]).to.be.undefined;
  });

  it('works with multiple serial fns whose Promises all resolve', async () => {
    let theData = await asyncTransport([
        asyncThing3,
        asyncThing4,
        asyncThing2
      ],
      {strategy: 'serial'}
    );

    expect(theData.hasErrors).to.equal(false);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.be.null;
    expect(theData.errors[1]).to.be.null;
    expect(theData.errors[1]).to.be.null;

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.deep.equal({ val: 4});
    expect(theData.data[1]).to.deep.equal({ val: 8});
    expect(theData.data[2]).to.deep.equal({ baz: 'boom' });
  });

  it('works with multiple serial fns when n Promises are rejected', async () => {
    let theData = await asyncTransport([
        asyncThingFail,
        asyncThing1,
        asyncThingFail
      ],
      {strategy: 'serial'}
    );

    expect(theData.hasErrors).to.equal(true);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.equal('Oh Noes!');
    expect(theData.errors[1]).to.be.null;
    expect(theData.errors[2]).to.equal('Oh Noes!');

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.be.undefined;
    expect(theData.data[1]).to.deep.equal({ foo: 'bar' });
    expect(theData.data[2]).to.be.undefined;
  });

  //
  // Promise tests
  it('works with a single Promise that resolves', async () => {
    let theData = await asyncTransport(asyncThing1());

    expect(theData.hasErrors).to.equal(false);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.be.null;

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.deep.equal({ foo: 'bar' });
  });

  it('works with a single fn whose Promise is rejected', async () => {
    let theData = await asyncTransport(asyncThingFail());

    expect(theData.hasErrors).to.equal(true);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.equal('Oh Noes!');

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.be.undefined;
  });


  it('works with multiple parallel fns whose Promises all resolve', async () => {
    let theData = await asyncTransport([
        asyncThing1(),
        asyncThing2()
      ]
    );

    expect(theData.hasErrors).to.equal(false);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.be.null;
    expect(theData.errors[1]).to.be.null;

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.deep.equal({ foo: 'bar' });
    expect(theData.data[1]).to.deep.equal({ baz: 'boom' });
  });

  it('works with multiple parallel fns when n Promises are rejected', async () => {
    let theData = await asyncTransport([
        asyncThingFail(),
        asyncThing1(),
        asyncThingFail()
      ]
    );

    expect(theData.hasErrors).to.equal(true);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.equal('Oh Noes!');
    expect(theData.errors[1]).to.be.null;
    expect(theData.errors[2]).to.equal('Oh Noes!');

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.be.undefined;
    expect(theData.data[1]).to.deep.equal({ foo: 'bar' });
    expect(theData.data[2]).to.be.undefined;
  });

  // note: need to test the ORDER of execution of these better...
  it('works with multiple serial fns whose Promises all resolve', async () => {
    let theData = await asyncTransport([
        () => {return asyncThing1()},
        () => {return asyncThing2()},
        () => {return asyncThing3()}
      ],
      {strategy: 'serial'}
    );

    expect(theData.hasErrors).to.equal(false);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.be.null;
    expect(theData.errors[1]).to.be.null;
    expect(theData.errors[2]).to.be.null;

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.deep.equal({ foo: 'bar' });
    expect(theData.data[1]).to.deep.equal({ baz: 'boom' });
    expect(theData.data[2]).to.deep.equal({ val: 4 });
  });

  // note: need to test the ORDER of execution of these better...
  it('works with multiple serial fns when n Promises are rejected', async () => {
    let theData = await asyncTransport([
        () => {return asyncThingFail()},
        () => {return asyncThing1()},
        () => {return asyncThingFail()}
      ]
    );

    expect(theData.hasErrors).to.equal(true);

    expect(theData.errors).to.be.an('array');
    expect(theData.errors[0]).to.equal('Oh Noes!');
    expect(theData.errors[1]).to.be.null;
    expect(theData.errors[2]).to.equal('Oh Noes!');

    expect(theData.data).to.be.an('array');
    expect(theData.data[0]).to.be.undefined;
    expect(theData.data[1]).to.deep.equal({ foo: 'bar' });
    expect(theData.data[2]).to.be.undefined;
  });

})

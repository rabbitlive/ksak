import install from '../install'

test('Install root tasks by default.', () => {
  const tasks = install()
  expect(tasks).toEqual({
    name: 'root',
    status: 0,
    subs: []
  })
})

test('Install tasks at top level.', () => {
  const tasks = install(
    'foo',
    { name: 'bar', from: 'root' },
    { name: 'baz' }
  )
  expect(tasks).toEqual({
    name: 'root',
    status: 0,
    subs: [{
      name: 'foo',
      status: 0,
      subs: []
    },{
      name: 'bar',
      status: 0,
      subs: []
    },{
      name: 'baz',
      status: 0,
      subs: []
    }]
  })
})

test('Install nest tasks', () => {
  const tasks = install(
    { name: 'foo' },
    { name: 'bar', parent: 'foo' },
    { name: 'baz', from: 'bar' }
  )
  expect(tasks).toEqual({
    name: 'root',
    status: 0,
    subs: [{
      name: 'foo',
      status: 0,
      subs: [{
        name: 'bar',
        status: 0,
        subs: [{
          name: 'baz',
          status: 0,
          subs: []
        }]
      }]
    }]
  })
})

test('Install tasks by order', () => {
  const tasks = install(
    { name: 'foo' },
    { name: 'bar', next: 'foo' },
    { name: 'baz', prev: 'bar' },
    { name: 'qux', before: 'bar' },
    { name: 'quxx', after: 'qux' }
  )
  expect(tasks).toEqual({
    name: 'root',
    status: 0,
    subs: [{
      name: 'foo',
      status: 0,
      subs: []
    },{
      name: 'baz',
      status: 0,
      subs: []
    },{
      name: 'qux',
      status: 0,
      subs: []
    },{
      name: 'quxx',
      status: 0,
      subs: []
    },{
      name: 'bar',
      status: 0,
      subs: []
    }]
  })
})

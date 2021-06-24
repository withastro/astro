import { createStore, getValue } from 'nanostores'

const users = createStore(() => {
  users.set([
    {
      name: 'Imanadmin',
      age: 2,
      isAdmin: true
    },
    {
      name: 'Imnotadmin',
      age: 35,
      isAdmin: false
    },
    {
      name: 'Wowsomuchadmin',
      age: 3634,
      isAdmin: true
    },
  ])
})

const addUser = function addUser(user) {
  users.set([...getValue(users), user])
}

export {
  users,
  addUser
}
```javascript
let data = {
  users: [
    {
      userId: 1,
      nameFirst: 'Rani',
      nameLast: 'Jiang',
      email: 'ranivorous@gmail.com',
      password: 'secretpassword',
      numSuccessfulLogins: 3,
      numFailedPasswordsSinceLastLogin: 1,
    },
  ],
  quizzes: [
    {
      userId: 1,
      quizId: 1,
      name: 'My Quiz',
      timeCreated: 1683125870,
      timeLastEdited: 1683125871,
      description: 'This is my quiz',
    },
  ],
};
```

[Optional] short description:
The above javascript object, data, stores information about 
users and quizzes in a list of objects (array of objects).
There are two arrays: users and quizzes.
The users array holds details about individual users, such as their 
user ID, names, email and password. The users array is a list of users.
The quizzes array includes details about each quiz, including 
the quiz ID, quiz name, timestampls and description.

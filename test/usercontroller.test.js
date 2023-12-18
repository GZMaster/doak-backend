/* eslint-disable no-undef */
/* eslint-disable node/no-unpublished-require */
// test/userController.test.js
const { test } = require("jest");
const { createUser } = require("../controllers/userController");

test("createUser function should create a new user", () => {
  // Arrange
  const userData = {
    name: "John Doe",
    email: "johndoe@example.com",
    password: "password123",
  };

  // Act
  const newUser = createUser(userData);

  // Assert
  expect(newUser).toBeDefined();
  expect(newUser.name).toBe(userData.name);
  expect(newUser.email).toBe(userData.email);
  // Add more assertions as needed
});

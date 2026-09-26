const request = require("supertest");
const mongoose = require("mongoose");
import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    afterEach,
    beforeEach
} from "vitest";

const app = require("../../app");
const User = require("../../models/User1");

let mongoServer;

beforeAll(async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/chatapp_test");
},60000);

afterEach(async () => {
    await User.deleteMany({});
});

afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    
},60000);

describe("Auth Integration Tests", () => {

    describe("POST /auth/signup", () => {

        it("should successfully create a new user", async () => {

            const response = await request(app)
                .post("/auth/signup")
                .send({
                    name: "Rajesh",
                    email: "rajesh@test.com",
                    password: "password123",
                    publicKey: "public-key",
                    publicECDH: "ecdh-key",
                    publicSign: "sign-key"
                });

            expect(response.statusCode).toBe(200);

            expect(response.body.token).toBeDefined();

            expect(response.body.user.email)
                .toBe("rajesh@test.com");

            const user = await User.findOne({
                email: "rajesh@test.com"
            });

            expect(user).not.toBeNull();
            expect(user.name).toBe("Rajesh");

            // Password should not be stored as plain text
            expect(user.password).not.toBe("password123");
        });


        it("should reject signup when required fields are missing", async () => {

            const response = await request(app)
                .post("/auth/signup")
                .send({
                    name: "Rajesh",
                    email: "rajesh@test.com"
                });

            expect(response.statusCode).toBe(400);

            expect(response.body.msg)
                .toBe("All Fields Required");
        });


        it("should reject duplicate email", async () => {

            await request(app)
                .post("/auth/signup")
                .send({
                    name: "Rajesh",
                    email: "rajesh@test.com",
                    password: "password123",
                    publicKey: "public-key",
                    publicECDH: "ecdh-key",
                    publicSign: "sign-key"
                });

            const response = await request(app)
                .post("/auth/signup")
                .send({
                    name: "Another User",
                    email: "rajesh@test.com",
                    password: "password456",
                    publicKey: "another-key",
                    publicECDH: "another-ecdh",
                    publicSign: "another-sign"
                });

            expect(response.statusCode).toBe(400);

            expect(response.body.msg)
                .toBe("User Already Exists");
        });
    });


    describe("POST /auth/login", () => {

        beforeEach(async () => {

            await request(app)
                .post("/auth/signup")
                .send({
                    name: "Rajesh",
                    email: "rajesh@test.com",
                    password: "password123",
                    publicKey: "public-key",
                    publicECDH: "ecdh-key",
                    publicSign: "sign-key"
                });
        });


        it("should successfully login", async () => {

            const response = await request(app)
                .post("/auth/login")
                .send({
                    email: "rajesh@test.com",
                    password: "password123"
                });

            expect(response.statusCode).toBe(200);

            expect(response.body.token).toBeDefined();

            expect(response.body.user.email)
                .toBe("rajesh@test.com");
        });


        it("should reject incorrect password", async () => {

            const response = await request(app)
                .post("/auth/login")
                .send({
                    email: "rajesh@test.com",
                    password: "wrongpassword"
                });

            expect(response.statusCode).toBe(400);

            expect(response.body.msg)
                .toBe("Invalid Credentials");
        });


        it("should reject nonexistent user", async () => {

            const response = await request(app)
                .post("/auth/login")
                .send({
                    email: "doesnotexist@test.com",
                    password: "password123"
                });

            expect(response.statusCode).toBe(400);

            expect(response.body.msg)
                .toBe("Invalid Credentials");
        });


        it("should reject missing email/password", async () => {

            const response = await request(app)
                .post("/auth/login")
                .send({
                    email: "rajesh@test.com"
                });

            expect(response.statusCode).toBe(400);

            expect(response.body.msg)
                .toBe("All Fields Required");
        });
    });
});
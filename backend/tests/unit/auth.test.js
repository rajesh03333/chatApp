import { describe, it, expect, beforeEach, vi } from "vitest";
import mock from "mock-require";

const User = {
  findOne: vi.fn(),
  create: vi.fn(),
};

const bcrypt = {
  hash: vi.fn(),
  compare: vi.fn(),
};

const jwt = {
  sign: vi.fn(),
};


mock("../../models/User1", User);
mock("bcrypt", bcrypt);
mock("jsonwebtoken", jwt);

const auth = await import("../../controllers/auth.js");

const { signup, login } = auth;

describe("Authentication Controller", () => {

  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    process.env.JWT_SECRET = "test-secret";
  });

  // Signup Tests

  describe("signup()", () => {

    it("should reject signup when required fields are missing", async () => {

      req.body = {
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "password123",
      };

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        msg: "All Fields Required",
      });

      expect(User.findOne).not.toHaveBeenCalled();
    });


    it("should reject signup when public keys are missing", async () => {

      req.body = {
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "password123",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
      };

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        msg: "All Fields Required",
      });

      expect(User.findOne).not.toHaveBeenCalled();
    });


    it("should reject signup when user already exists", async () => {

      req.body = {
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "password123",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      };

      User.findOne.mockResolvedValue({
        _id: "existing-user",
      });

      await signup(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "rajesh@example.com",
      });

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        msg: "User Already Exists",
      });
    });


    it("should hash the password before creating the user", async () => {

      req.body = {
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "password123",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      };

      User.findOne.mockResolvedValue(null);

      bcrypt.hash.mockResolvedValue("hashed-password");

      User.create.mockResolvedValue({
        _id: "user123",
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "hashed-password",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      });

      jwt.sign.mockReturnValue("test-token");

      await signup(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        "password123",
        10
      );
    });


    it("should create user with hashed password", async () => {

      req.body = {
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "password123",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      };

      User.findOne.mockResolvedValue(null);

      bcrypt.hash.mockResolvedValue("hashed-password");

      User.create.mockResolvedValue({
        _id: "user123",
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "hashed-password",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      });

      jwt.sign.mockReturnValue("test-token");

      await signup(req, res);

      expect(User.create).toHaveBeenCalledWith({
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "hashed-password",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      });
    });


    it("should return token and user after successful signup", async () => {

      req.body = {
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "password123",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      };

      User.findOne.mockResolvedValue(null);

      bcrypt.hash.mockResolvedValue("hashed-password");

      User.create.mockResolvedValue({
        _id: "user123",
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "hashed-password",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      });

      jwt.sign.mockReturnValue("test-token");

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        token: "test-token",
        user: {
          _id: "user123",
          name: "Rajesh",
          email: "rajesh@example.com",
          publicKey: "public-key",
          publicECDH: "ecdh-key",
          publicSign: "sign-key",
        },
      });
    });


    it("should generate JWT correctly", async () => {

      req.body = {
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "password123",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      };

      User.findOne.mockResolvedValue(null);

      bcrypt.hash.mockResolvedValue("hashed-password");

      User.create.mockResolvedValue({
        _id: "user123",
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "hashed-password",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      });

      jwt.sign.mockReturnValue("test-token");

      await signup(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: "user123",
          name: "Rajesh",
        },
        "test-secret",
        {
          expiresIn: "7D",
        }
      );
    });


    it("should return 500 when database throws error", async () => {

      req.body = {
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "password123",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      };

      User.findOne.mockRejectedValue(
        new Error("Database error")
      );

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        msg: "Server Error",
        error: "Database error",
      });
    });

  });

  // Login Tests

  describe("login()", () => {

    it("should reject login when email is missing", async () => {

      req.body = {
        password: "password123",
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        msg: "All Fields Required",
      });
    });


    it("should reject login when password is missing", async () => {

      req.body = {
        email: "rajesh@example.com",
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        msg: "All Fields Required",
      });
    });


    it("should reject login when user does not exist", async () => {

      req.body = {
        email: "unknown@example.com",
        password: "password123",
      };

      User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "unknown@example.com",
      });

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        msg: "Invalid Credentials",
      });
    });


    it("should reject login with incorrect password", async () => {

      req.body = {
        email: "rajesh@example.com",
        password: "wrongpassword",
      };

      User.findOne.mockResolvedValue({
        _id: "user123",
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "hashed-password",
      });

      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        "hashed-password"
      );

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        msg: "Invalid Credentials",
      });
    });


    it("should successfully login with correct credentials", async () => {

      req.body = {
        email: "rajesh@example.com",
        password: "password123",
      };

      User.findOne.mockResolvedValue({
        _id: "user123",
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "hashed-password",
        publicKey: "public-key",
        publicECDH: "ecdh-key",
        publicSign: "sign-key",
      });

      bcrypt.compare.mockResolvedValue(true);

      jwt.sign.mockReturnValue("test-token");

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        token: "test-token",
        user: {
          _id: "user123",
          name: "Rajesh",
          email: "rajesh@example.com",
          publicKey: "public-key",
          publicECDH: "ecdh-key",
          publicSign: "sign-key",
        },
      });
    });


    it("should generate JWT correctly during login", async () => {

      req.body = {
        email: "rajesh@example.com",
        password: "password123",
      };

      User.findOne.mockResolvedValue({
        _id: "user123",
        name: "Rajesh",
        email: "rajesh@example.com",
        password: "hashed-password",
      });

      bcrypt.compare.mockResolvedValue(true);

      jwt.sign.mockReturnValue("test-token");

      await login(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: "user123",
          name: "Rajesh",
        },
        "test-secret",
        {
          expiresIn: "7D",
        }
      );
    });


    it("should return 500 when login throws error", async () => {

      req.body = {
        email: "rajesh@example.com",
        password: "password123",
      };

      User.findOne.mockRejectedValue(
        new Error("Database error")
      );

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        msg: "Server Error",
        error: "Database error",
      });
    });

  });

});
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const databasePath = path.join(__dirname, "twitterClone.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

function authenticateToken(request, response, next) {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "Srihari143@", async (error, payload) => {
      console.log(payload);
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
}

// Register API

app.post("/register/", async (request, response) => {
  const { username, name, password, gender } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const databaseUser = await database.get(selectUserQuery);
  if (databaseUser === undefined) {
    if (password.length > 6) {
      const hashedPassword = await bcrypt.hash(request.body.password, 10);
      const createUserQuery = `
      INSERT INTO 
      user (name, username, password, gender)
      VALUES ("${name}", "${username}", "${hashedPassword}", "${gender}");
      `;
      await database.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status = 400;
      response.send("Password is too short");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

//LOGIN API

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "Srihari143@");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//User Following API

app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  const userTweetQuery = `
    SELECT
      user.username,
      tweet.tweet,
      tweet.date_time
    FROM user 
    INNER JOIN follower
    ON user.user_id = follower.follower_id
    INNER JOIN tweet
    ON follower.following_user_id = tweet.user_id
    LIMIT 4;
    `;
  const tweets = await database.all(userTweetQuery);
  response.send(tweets);
});

module.exports = app;

//user follows API

app.get("/user/following/", authenticateToken, async (request, response) => {
  const userFollowsQuery = `
    SELECT
    user.name
    FROM
    user 
    INNER JOIN follower
    ON user.user_id = follower.follower_user_id;
    `;
  const userFollows = await database.all(userFollowsQuery);
  response.send(userFollows);
});

//user follows API

app.get("/user/followers/", authenticateToken, async (request, response) => {
  console.log(payload);
  const userFollowsQuery = `
    SELECT
    user.name
    FROM
    user 
    INNER JOIN follower
    ON user.user_id = follower.following_user_id;
    `;
  const userFollowers = await database.all(userFollowsQuery);
  response.send(userFollowers);
});

//getting Tweet API

app.get("/tweets/:tweetId/", authenticateToken, async (request, response) => {
  const { tweetId } = request.params;
  const tweetQuery = `
    SELECT
    *
    FROM
    tweet
    WHERE
    tweet_id = ${tweetId};
    `;
  const tweet = await database.get(tweetQuery);
  if (tweet !== undefined) {
    response.send(tweet);
  } else {
    response.status(401);
    response.send("Invalid Request");
  }
});

//getting Tweet likes API

app.get(
  "/tweets/:tweetId/likes/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const tweetQuery = `
    SELECT
    user.name
    FROM user 
    INNER JOIN follower
    ON user.user_id = likes.user_id
    WHERE
    tweet_id = ${tweetId};
    `;
    const tweetLikes = await database.all(tweetQuery);
    if (tweet !== undefined) {
      response.send(tweetLikes);
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

//getting Tweet replies API

app.get(
  "/tweets/:tweetId/replies/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const tweetQuery = `
    SELECT
    user.name
    FROM user 
    INNER JOIN follower
    ON user.user_id = reply.user_id
    WHERE
    tweet_id = ${tweetId};
    `;
    const tweetReplies = await database.all(tweetQuery);
    if (tweet !== undefined) {
      response.send(tweetReplies);
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

// user tweets API

app.get("/user/tweets/", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "Srihari143@", async (error, payload) => {
      console.log(payload);
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const { username } = payload;
        const userQuery = `SELECT * FROM user WHERE username = "${username}";`;
        const userData = await database.get(userQuery);
        console.log(userData);
        const tweetsQuery = `
        SELECT
        tweet.tweet
        SUM()
        `;
      }
    });
  }
});

const stytchClient = require("./stytch-config");
const Strategy = require('passport-strategy');

class StytchAuthStrategy extends Strategy {
  constructor() {
    super();
    this.name = 'stytch-strategy';
  }
  async authenticate(req, options = {}) {
    const sanitizedOptions = {
      action: "sendMagicLink",
      ...options,
    };

    if (sanitizedOptions.action === "sendMagicLink") {
      const { message, error } = await loginOrCreate(req.body.email);
      req.flash("info", message)
      if (error) {
        return this.error({ message: error.message });
      }
      return this.pass();
    }

    if (sanitizedOptions.action === "authenticateMagicLink") {
      if (!req.query.token) {
        return this.fail({ message: "Token is required" });
      }

      const { message, error } = await authenticateMagicLink(req.query.token, req);
      if (error) {
        return this.fail({ message: error.message });
      }
      return this.pass();
    }

    if (sanitizedOptions.action === "authenticateSessionJWT") {
      const sessionJWT =
        req.session?.session_jwt || req.session?.passport?.user?.session_jwt;
      if (!sessionJWT) {
        return this.fail({ message: "Please log in" });
      }
      const { response, error } = await authenticateSessionJWT(sessionJWT);
      if (error) {
        return this.fail({ message: error.message });
      }
      const user_id = response.session.user_id;
      const userData = await getUserData(user_id);
      return this.success({...userData, session_jwt: sessionJWT});
    }

  }
}

async function loginOrCreate(email) {
    try {
        const response = await stytchClient.magicLinks.email.loginOrCreate({
            email,
        });

        const message = `User ${
            response.user_created ? "does not exist. An invitation has been sent" : "is not logged in. Login magic link sent"
        }`;

        return { message, response };
    } catch (error) {
        return { error };
    }
}

async function authenticateMagicLink(token, req) {
    try {
      const response = await stytchClient.magicLinks.authenticate({
        token,
        session_duration_minutes: "43200", //30 days
      });
  
      if (response.status_code === 200) {
        req.session.session_jwt = response.session_jwt;
      }
  
      return { message: "Token verified successfully", response };
    } catch (error) {
      return { error };
    }
}

async function authenticateSessionJWT(sessionJWT) {
    try {
      const response = await stytchClient.sessions.authenticateJwt({
        session_jwt: sessionJWT,
      });
  
      return { response };
    } catch (error) {
      return { error };
    }
}

async function getUserData(userId) {
    try {
      const response = await stytchClient.users.get({ user_id: userId });
  
      return response;
    } catch (error) {
      throw error;
    }
}

module.exports = StytchAuthStrategy;
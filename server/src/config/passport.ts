import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { Strategy as GitHubStrategy, Profile } from "passport-github2"
import prisma from "../generated/index"

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_OAUTH_REDIRECT_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({
          where: { email: profile.emails?.[0].value },
        })
        if (user && user.provider !== "google") {
          return done(null, false, {
            message: `Please login using ${user.provider}`,
          })
        }

        if (!user) {
          user = await prisma.user.create({
            data: {
              firstName: profile.name?.givenName || "",
              lastName: profile.name?.familyName || "",
              email: profile.emails?.[0].value!,
              password: "",
              provider: "google",
            },
          })
        }
        return done(null, user)
      } catch (err) {
        console.log("error passport", err)
        return done(err)
      }
    }
  )
)

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_OAUTH_REDIRECT_URL!,
      scope: ["user:email"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: any
    ) => {
      try {
        const email = profile.emails?.[0]?.value
        console.log("github", profile)
        if (!email) return done(null, false, { message: "Email not found" })

        let user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (user && user.provider !== "github") {
          return done(null, false, {
            message: `Please login with ${user.provider}`,
          })
        }

        if (!user) {
          const fullName = profile.displayName || profile.username || ""
          const [firstName, ...rest] = fullName.split(" ")
          const lastName = rest.join(" ")

          user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              firstName,
              lastName,
              password: "",
              provider: "github",
            },
          })
        }

        return done(null, user)
      } catch (err) {
        done(err)
      }
    }
  )
)

export default passport

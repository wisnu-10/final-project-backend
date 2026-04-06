import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./prisma-client.config";
import { BASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "./main.config";


passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      callbackURL: `${BASE_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(new Error("No email from Google"));

        let user = await prisma.customer.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.customer.create({
            data: {
              email,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profilePicture: profile.photos?.[0].value,
              isVerified: true,
              oauthAccounts: {
                create: {
                  provider: "GOOGLE",
                  providerAccountId: profile.id,
                },
              },
            },
          });
        } else {
          // cek apakah udah ada oauth
          const existingOauth = await prisma.oauthAccount.findFirst({
            where: {
              provider: "GOOGLE",
              providerAccountId: profile.id,
            },
          });

          if (!existingOauth) {
            await prisma.oauthAccount.create({
              data: {
                customerId: user.id,
                provider: "GOOGLE",
                providerAccountId: profile.id,
              },
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);

export default passport;

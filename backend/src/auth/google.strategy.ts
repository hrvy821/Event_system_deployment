import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private usersService: UsersService) {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback';

    if (!clientID || !clientSecret) {
      throw new Error('Google OAuth client ID and secret must be set in environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails } = profile;
    const email = emails[0].value;
    const fullName = `${name.givenName} ${name.familyName}`;

    // Check if user already exists in your database
    let user = await this.usersService.findOneByEmail(email);

    // If they don't exist, we create a new account for them instantly!
    if (!user) {
      // We create a random temporary password because Google users don't need passwords to log in
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'; 
      
      // 🌟 FIX: We completely removed the `this.usersService.create(payload)` call here!
      // We ONLY call activateGoogleUser to save them directly to the DB without OTP memory loops.
      user = await this.usersService.activateGoogleUser(email, fullName, tempPassword);
    }

    done(null, user);
  }
}
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private usersService: UsersService) {
    const clientID = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const callbackURL = process.env.FACEBOOK_CALLBACK_URL ?? 'http://localhost:3000/auth/facebook/callback';

    if (!clientID || !clientSecret) {
      throw new Error('Facebook app ID and secret must be set in environment variables (FACEBOOK_APP_ID, FACEBOOK_APP_SECRET).');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      profileFields: ['id', 'displayName', 'emails', 'name'],
      scope: ['email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any) => void): Promise<any> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Facebook account did not provide an email address.'), false);
    }

    const fullName =
      profile.displayName ||
      [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
      email.split('@')[0];

    let user = await this.usersService.findOneByEmail(email);

    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
      user = await this.usersService.activateGoogleUser(email, fullName, tempPassword);
    }

    done(null, user);
  }
}

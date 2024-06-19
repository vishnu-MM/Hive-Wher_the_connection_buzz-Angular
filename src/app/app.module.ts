import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UserModule } from "./user/user.module";
import { LoginPageComponent } from './login-page/login-page.component';
import { SignUpPageComponent } from './sign-up-page/sign-up-page.component';
import { VerifyOtpPageComponent } from './otp-verify-page/verify-otp-page.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { userReducer } from 'src/Shared/Store/user.reducer';
import { UserEffects } from 'src/Shared/Store/user.effects';
import { NgToastModule } from 'ng-angular-popup';
import { HttpIntercepterProviders } from 'src/Shared/HTTP-Intercepters';

@NgModule({
  declarations: [
    AppComponent,
    LoginPageComponent,
    SignUpPageComponent,
    VerifyOtpPageComponent,
  ],
  imports: [
    StoreModule.forRoot({ UserStore: userReducer }),
    EffectsModule.forRoot([UserEffects]),
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    UserModule,
    FormsModule,
    HttpClientModule,
    NgToastModule
  ],
  providers: [HttpIntercepterProviders],
  bootstrap: [AppComponent]
})
export class AppModule { }

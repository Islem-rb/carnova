import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { TestComponent } from './Home/test.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EspaceComponent } from './espace/espace.component';
import { CreerAnnonceComponent } from './espace/creer-annonce/creer-annonce.component';
import { MesAnnoncesComponent } from './espace/mes-annonces/mes-annonces.component';
import { TestAuthComponent } from './espace/test-auth/test-auth.component';
import { TestConnectionComponent } from './test-connection/test-connection.component';
import { TestImageComponent } from './test-image/test-image.component';
import { CreerShowroomComponent } from './espace/creer-showroom/creer-showroom.component';
import { AuthTokenInterceptor } from './interceptors/auth-token.interceptor';
import { ShowroomDetailsComponent } from './espace/showroom-details/showroom-details.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssistantBubbleComponent } from './espace/assistant-bubble/assistant-bubble.component';
import { Car3dComponent } from './espace/car3d/car3d.component';
import { Info3dComponent } from './info3d/info3d.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { CarDriveComponent } from './car-drive/car-drive.component';
import { GuideLayoutComponent } from './pages/guide/guide-layout/guide-layout.component';
import { FcrComponent } from './pages/guide/fcr/fcr.component';
import { DouanesComponent } from './pages/guide/douanes/douanes.component';
import { VisiteTechniqueComponent } from './pages/guide/visite-technique/visite-technique.component';
import { VignetteComponent } from './pages/guide/vignette/vignette.component';
import { ActualitesComponent } from './pages/actualites/actualites.component';
@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    TestComponent,
    LoginComponent,
    SignupComponent,
    DashboardComponent,
    EspaceComponent,
    CreerAnnonceComponent,
    MesAnnoncesComponent,
    TestAuthComponent,
    TestConnectionComponent,
    TestImageComponent,
    CreerShowroomComponent,
    ShowroomDetailsComponent,
    AssistantBubbleComponent,
    Info3dComponent,
    AboutComponent,
    ContactComponent,
    CarDriveComponent,
    GuideLayoutComponent,
    FcrComponent,
    DouanesComponent,
    VisiteTechniqueComponent,
    VignetteComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    CommonModule,
    RouterModule,
    ReactiveFormsModule

  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

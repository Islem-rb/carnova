import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestComponent } from './Home/test.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { EspaceComponent } from './espace/espace.component';
import { CreerAnnonceComponent } from './espace/creer-annonce/creer-annonce.component';
import { MesAnnoncesComponent } from './espace/mes-annonces/mes-annonces.component';
import { TestAuthComponent } from './espace/test-auth/test-auth.component';
import { TestConnectionComponent } from './test-connection/test-connection.component';
import { TestImageComponent } from './test-image/test-image.component';
import { CreerShowroomComponent } from './espace/creer-showroom/creer-showroom.component';
import { ShowroomDetailsComponent } from './espace/showroom-details/showroom-details.component';
import { Info3dComponent } from './info3d/info3d.component'; // 🔹 import
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { GuideLayoutComponent } from './pages/guide/guide-layout/guide-layout.component';
import { FcrComponent } from './pages/guide/fcr/fcr.component';
import { DouanesComponent } from './pages/guide/douanes/douanes.component';
import { VisiteTechniqueComponent } from './pages/guide/visite-technique/visite-technique.component';
import { VignetteComponent } from './pages/guide/vignette/vignette.component';
import { ActualitesComponent } from './pages/actualites/actualites.component';

const routes: Routes = [
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: 'Home', component: TestComponent },
  { path: 'Login', component: LoginComponent },
  { path: 'Registre', component: SignupComponent },
  { path: 'admin', component: DashboardComponent },
  { path: 'espace', component: EspaceComponent },
  { path: 'espace/creer-annonce', component: CreerAnnonceComponent },
  { path: 'espace/mes-annonces', component: MesAnnoncesComponent },
  { path: 'espace/test-auth', component: TestAuthComponent },
  { path: 'espace/showroom/:id', component: ShowroomDetailsComponent },
  { path: 'espace/creer-showroom', component: CreerShowroomComponent },
  { path: 'test-connection', component: TestConnectionComponent },
  { path: 'test-image', component: TestImageComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'actualites', component: ActualitesComponent },


{
  path: 'guide',
  component: GuideLayoutComponent,
  children: [
    { path: '', redirectTo: 'fcr', pathMatch: 'full' },
    { path: 'fcr', component: FcrComponent },
    { path: 'douanes', component: DouanesComponent },
    { path: 'visite-technique', component: VisiteTechniqueComponent },
    { path: 'vignette', component: VignetteComponent },
  ]
},






  // 🔹 nouvelle route
  { path: 'info', component: Info3dComponent },
  { path: '**', redirectTo: '/Home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

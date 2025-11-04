import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="site-footer">
      <div class="footer-wrap">
        <div class="brand">
          <img src="assets/illustrations/Logo-ecoride.png" alt="EcoRide logo" />
        </div>

        <div class="contact">
          <div class="title">EcoRide SAS</div>
          <ul>
            <li>12 rue du Colibris, 75010 Paris, France</li>
            <li>06 12 34 56 78</li>
            <li><a href="mailto:contact@ecoride.com">contact@ecoride.com</a></li>
            <li>L’équipe EcoRide vous répond sous 24h</li>
          </ul>
        </div>

        <div class="wordmark">EcoRide</div>
      </div>
    </footer>
  `,
  styles: [
    `
      .site-footer {
        background: #f3f4f3;
        border-top: 1px solid #e0e2e0;
        padding: 22px 0;
      }
      .footer-wrap {
        max-width: none;
        width: 100%;
        padding: 0 24px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 24px;
      }
      .footer-wrap .brand img {
        height: 72px;
        width: auto;
        display: block;
      }
      .contact {
        justify-self: center;
        text-align: center;
        display: grid;
        grid-auto-rows: min-content;
        row-gap: 8px;
      }
      .contact .title {
        font-weight: 700;
        margin-bottom: 6px;
      }
      .contact ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 48px;
        row-gap: 6px;
      }
      .contact a {
        color: #111;
        text-decoration: none;
      }
      .wordmark {
        justify-self: end;
        text-align: right;
        font-family: 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial,
          sans-serif;
        font-weight: 800;
        font-size: 28px;
        letter-spacing: 0.02em;
        color: #1b1b1b;
      }
      @media (max-width: 768px) {
        .footer-wrap {
          grid-template-columns: 1fr;
          justify-items: center;
          text-align: center;
          row-gap: 14px;
        }
        .footer-wrap .brand img {
          height: 84px;
        }
        .wordmark {
          justify-self: center;
          text-align: center;
          width: 100%;
          font-size: 30px;
        }
      }
    `,
  ],
})
export default class FooterComponent {}

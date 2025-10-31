import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';

@Component({
  selector: 'app-avatar-picker',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./avatar-picker.component.scss'],
  template: `
    <!-- Backdrop -->
    <div class="picker-backdrop" (click)="close()"></div>

    <!-- Carte picker -->
    <div class="picker">
      <h3>Choisir un avatar</h3>

      <div class="grid">
        <!-- Tuile pour revenir aux initiales -->
        <button type="button" class="cell initials" (click)="pick.emit(null)">
          <span class="letters">AD</span>
          <small>Initiales</small>
        </button>

        <!-- Avatars -->
        <button
          *ngFor="let a of avatars; let i = index"
          type="button"
          class="cell"
          (click)="pick.emit(a)"
          [class.hidden]="broken().has(i)"
          aria-label="Choisir cet avatar"
        >
          <img [src]="a" alt="Avatar" loading="lazy" (error)="markBroken(i)" />
        </button>
      </div>

      <button type="button" class="close" (click)="close()">Fermer</button>
    </div>
  `,
  styles: [
    `
      .picker-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(2px);
        z-index: 9998;
      }
      .picker {
        position: fixed;
        left: 50%;
        top: 6svh;
        transform: translateX(-50%);
        width: min(980px, 92vw);
        background: #fff;
        border-radius: 20px;
        padding: 18px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
        z-index: 9999;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px;
      }
      @media (max-width: 720px) {
        .grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .cell {
        background: #f7f7f7;
        border-radius: 14px;
        padding: 10px;
        border: 1px solid #ececec;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 140px;
      }
      .cell img {
        width: 100%;
        height: auto;
        display: block;
      }
      .cell.hidden {
        display: none;
      }

      .cell.initials {
        background: #eef7ef;
        border-color: #deecde;
        flex-direction: column;
        gap: 6px;
      }
      .cell.initials .letters {
        font: 700 32px/1 'Poppins', system-ui;
        color: #2b7a2b;
      }
      .cell.initials small {
        color: #2b7a2b;
        opacity: 0.9;
      }

      .close {
        margin-top: 12px;
      }
    `,
  ],
})
export default class AvatarPickerComponent {
  @Output() pick = new EventEmitter<string | null>();
  @Output() cancel = new EventEmitter<void>();

  // Fichiers présents dans assets/illustrations (espaces gérés)
  private files = [
    'Avatar1.png',
    'Avatar2.png',
    'Avatar3.png',
    'Avatar4.png',
    'Avatar5.png',
    'Avatar6.png',
    'Avatar7.png',
  ];

  // On encode les noms (espaces, crochets, etc.)
  avatars = this.files.map((f) => `assets/illustrations/${encodeURIComponent(f)}`);

  // Cache des images cassées -> on masque la tuile
  broken = signal<Set<number>>(new Set());
  markBroken(i: number) {
    const s = new Set(this.broken());
    s.add(i);
    this.broken.set(s);
  }

  close() {
    this.cancel.emit();
  }
}

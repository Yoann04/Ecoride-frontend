import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';

@Component({
  selector: 'app-avatar-picker',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./avatar-picker.component.scss'],
  template: `
    <div
      class="picker-card"
      role="dialog"
      aria-modal="true"
      aria-label="Sélecteur d'avatar"
      (click)="$event.stopPropagation()"
    >
      <h3>Choisir un avatar</h3>

      <div class="grid">
        <button type="button" class="avatar-item" (click)="onPick(null)">
          <div class="inner initials">
            <span class="letters">{{ initialsText }}</span>
            <small>Initiales</small>
          </div>
        </button>

        <!-- Avatars -->
        <button
          *ngFor="let a of avatars; let i = index"
          type="button"
          class="avatar-item"
          (click)="onPick(a)"
          [class.hidden]="broken().has(i)"
          aria-label="Choisir cet avatar"
        >
          <img [src]="a" alt="Avatar" loading="lazy" (error)="markBroken(i)" />
        </button>
      </div>

      <footer>
        <button type="button" class="close" (click)="cancel.emit()">Fermer</button>
      </footer>
    </div>
  `,
})
export default class AvatarPickerComponent {
  /** Liste d’avatars */
  @Input() avatars: string[] = [
    'assets/illustrations/Avatar1.png',
    'assets/illustrations/Avatar2.png',
    'assets/illustrations/Avatar3.png',
    'assets/illustrations/Avatar4.png',
    'assets/illustrations/Avatar5.png',
    'assets/illustrations/Avatar6.png',
    'assets/illustrations/Avatar7.png',
  ];

  @Input() initialsText: string = 'IN';

  @Output() pick = new EventEmitter<string | null>();
  @Output() cancel = new EventEmitter<void>();

  broken = signal<Set<number>>(new Set());
  markBroken(i: number) {
    const s = new Set(this.broken());
    s.add(i);
    this.broken.set(s);
  }

  @HostListener('click')
  onHostClick() {
    this.cancel.emit();
  }

  onPick(value: string | null) {
    this.pick.emit(value);
  }
}

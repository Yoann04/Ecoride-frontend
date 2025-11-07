import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

type AdminUser = {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  pseudo?: string;
  roles: string[];
  createdAt?: string | null;
};

type SortPreset =
  | 'created_desc'
  | 'created_asc'
  | 'name_asc'
  | 'name_desc'
  | 'email_asc'
  | 'email_desc'
  | 'role_asc'
  | 'role_desc';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export default class AdminUsersComponent {
  constructor(private http: HttpClient) {}

  users: AdminUser[] = [];
  loading = false;
  error: string | null = null;

  q = '';
  roleFilter: '' | 'ROLE_USER' | 'ROLE_DRIVER' | 'ROLE_ADMIN' = '';
  sortPreset: SortPreset = 'created_desc';

  page = 1;
  pageSize = 10;

  private readonly FORCE_MOCK = false;

  async ngOnInit() {
    this.loading = true;
    this.error = null;
    try {
      if (this.FORCE_MOCK) throw new Error('force-mock');
      const data = await firstValueFrom(this.http.get<AdminUser[]>('/api/users'));
      this.users = (data ?? []).map((u) => ({
        ...u,
        createdAt: u.createdAt ?? '2025-10-01T10:00:00Z',
      }));
    } catch {
      this.users = [
        {
          id: 1,
          email: 'alice@example.com',
          prenom: 'Alice',
          nom: 'Durand',
          roles: ['ROLE_USER', 'ROLE_DRIVER'],
          createdAt: '2025-10-04T09:00:00Z',
        },
        {
          id: 2,
          email: 'chloe@example.com',
          prenom: 'Chloé',
          nom: 'Martin',
          roles: ['ROLE_USER'],
          createdAt: '2025-10-04T11:00:00Z',
        },
        {
          id: 3,
          email: 'gabin@example.com',
          prenom: 'Gabin',
          nom: 'Duc',
          roles: ['ROLE_USER'],
          createdAt: '2025-10-03T08:00:00Z',
        },
        {
          id: 4,
          email: 'laurent@example.com',
          prenom: 'Laurent',
          nom: 'Perrin',
          roles: ['ROLE_DRIVER'],
          createdAt: '2025-10-02T13:00:00Z',
        },
        {
          id: 5,
          email: 'yoann@ecoride.com',
          prenom: 'Yoann',
          nom: 'Admin',
          roles: ['ROLE_ADMIN'],
          createdAt: '2025-10-01T10:00:00Z',
        },
      ];
    } finally {
      this.loading = false;
    }
  }

  get filtered(): AdminUser[] {
    const q = this.q.trim().toLowerCase();
    let list = [...this.users];

    if (q) {
      list = list.filter((u) => {
        const name = `${u.prenom ?? ''} ${u.nom ?? ''}`.toLowerCase();
        return name.includes(q) || u.email?.toLowerCase().includes(q);
      });
    }

    if (this.roleFilter) list = list.filter((u) => u.roles?.includes(this.roleFilter));

    const [key, dir] = this.sortPreset.split('_') as [string, 'asc' | 'desc'];
    list.sort((a, b) => {
      let av = '',
        bv = '';
      switch (key) {
        case 'name':
          av = `${a.prenom ?? ''} ${a.nom ?? ''}`.trim().toLowerCase();
          bv = `${b.prenom ?? ''} ${b.nom ?? ''}`.trim().toLowerCase();
          break;
        case 'email':
          av = a.email?.toLowerCase() ?? '';
          bv = b.email?.toLowerCase() ?? '';
          break;
        case 'role':
          av = (a.roles?.[0] ?? '').toLowerCase();
          bv = (b.roles?.[0] ?? '').toLowerCase();
          break;
        case 'created':
        default:
          av = a.createdAt ?? '';
          bv = b.createdAt ?? '';
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });

    return list;
  }

  get total(): number {
    return this.filtered.length;
  }
  get paged(): AdminUser[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  onSortChange() {
    this.page = 1;
  }
  next() {
    if (this.page * this.pageSize < this.total) this.page++;
  }
  prev() {
    if (this.page > 1) this.page--;
  }

  prettyRole(r: string): string {
    const R = r.toUpperCase();
    if (R.includes('ROLE_ADMIN')) return 'Admin';
    if (R.includes('ROLE_DRIVER')) return 'Conducteur';
    if (R.includes('ROLE_USER')) return 'Utilisateur';
    return r.replace(/^ROLE_/, '');
  }
  initials(u: AdminUser): string {
    const pseudo = (u as any)?.pseudo?.trim();
    if (pseudo) return (pseudo.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '').slice(0, 2) || '?').toUpperCase();
    const p = u.prenom?.[0] ?? '';
    const n = u.nom?.[0] ?? '';
    const fb = u.email?.[0] ?? '?';
    return (p + n || fb).toUpperCase();
  }
  displayName(u: AdminUser): string {
    const full = [u.prenom, u.nom].filter(Boolean).join(' ').trim();
    return full || u.email;
  }
  dateFR(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
  }
}

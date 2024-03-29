import { Component } from '@angular/core';
interface UserInfo {
  title: string;
  value: string;
}

interface UserStat {
  title: string;
  icon: string;
  value: number | string;
}

interface User {
  level: number;
  points: number;
  name: string;
  image?: string;
  info: UserInfo[];
  stats: UserStat[];
  description: string;
  isGreen?: boolean;
}

@Component({
  selector: 'app-list-products',
  templateUrl: './list-products.component.html',
  styleUrl: './list-products.component.css'
})
export class ListProductsComponent {
  users: User[] = [
    {
      level: 14,
      points: 5312,
      name: 'Jane Doe',
      info: [
        { title: 'Group Name', value: 'Joined January 2019' },
        { title: 'Position/Role', value: 'City, Country' }
      ],
      stats: [
        { title: 'Awards', icon: 'fa fa-trophy', value: 2 },
        { title: 'Matches', icon: 'fa fa-gamepad', value: 27 },
        { title: 'Pals', icon: 'fa fa-group', value: 123 },
        { title: 'Coffee', icon: 'fa fa-coffee', value: '∞' }
      ],
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce a volutpat mauris, at molestie lacus. Nam vestibulum sodales odio ut pulvinar.',
      isGreen: false
    },
    // Add more user objects as needed
  ];
}

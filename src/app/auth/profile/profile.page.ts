import { Component } from '@angular/core';

import { CommonService } from '../../shared/common.service';
import { ProfileService } from '../profile.service';

@Component({
    selector: 'app.profile',
    templateUrl: './profile.page.html'
})
export class ProfilePage {
    constructor(
        public commonData: CommonService,
        public _profileService: ProfileService,
    ) { }
}
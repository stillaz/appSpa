import { NgModule } from '@angular/core';
import { SearchPipe } from './search/search';
import { JoinsPipe } from './joins/joins';

@NgModule({
	declarations: [SearchPipe,
		JoinsPipe],
	imports: [],
	exports: [SearchPipe,
		JoinsPipe]
})
export class PipesModule { }

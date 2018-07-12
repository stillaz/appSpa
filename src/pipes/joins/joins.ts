import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the JoinsPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'joins',
})
export class JoinsPipe implements PipeTransform {
  /**
   * Takes a value and makes it lowercase.
   */
  transform(items: any[]) {
    if (items && items.length > 0) {
      return items.map(item => item.nombre).join(' - ');
    }
    return null;
  }
}

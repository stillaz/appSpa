import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the SearchPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'search',
})
export class SearchPipe implements PipeTransform {

  transform(items: any[], terms: string): any[] {
    if (!items) return [];
    if (!terms) return items;
    terms = terms.toLowerCase();
    const itemsList = items.map(i => i.disponibilidad);

    const itemsL = itemsList;
    itemsL.forEach((item, index) => {
      item.forEach((reserva) => {
        if(reserva.estado.toLowerCase() !== terms){
          let nitem = item.indexOf(reserva);
          itemsList[index].splice(nitem, 1);
        }
      });
    });
    
    return items.filter(it => {
      return it.disponibilidad.some(reserva => {
          return reserva.estado.toLowerCase() === terms;
      });
    });
  }
}

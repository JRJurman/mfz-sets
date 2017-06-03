const Nightmare = require('nightmare');
// const nightmare = Nightmare({ show: true });

const colorURL = 'http://www.brickowl.com/wishlist/view/BrickTiger/mobile-frame-zero-garage-kit-for-brickowl'
const ENTER_KEY = '\u000d';

const getPiecesFromPage = () => {
  const getHref = item => item.querySelector('a').href;
  const getName = item => item.querySelector('h2').textContent.trim();

  // get all the pieces on the wishlist
  const items = document.querySelectorAll('.category-item');

  // turn them into objects
  return Array.prototype.map.call(items, (item, index) => ({
    name: getName(item),
    href: getHref(item),
    index: index
  }));
}

const clearLocalStorage = () => {
  localStorage.clear();
}

const pullFromLocalStorage = () => {
  return Object.keys(localStorage).reduce((localObject, pieceName) => {
    return Object.assign(
      {}, localObject,
      {[pieceName]: JSON.parse(localStorage[pieceName])}
    );
  }, {})
}

const addToLocalStorage = ({pieceObject, isColor}) => {
  const localPiece = JSON.parse(localStorage[pieceObject.index] || '{}');
  const price = parseFloat(document.querySelector('td span.price').textContent.split('$')[1]);
  const key = isColor ? 'color_price' : 'lowest_price';
  const newPieceObject = Object.assign({}, localPiece, {[key]: price});

  localStorage.setItem(pieceObject.index, JSON.stringify(newPieceObject));
}

const getPriceDifferences = (pieceObjects) => {
  const reduceNightmare = Nightmare({ show: true, dock: true });
  reduceNightmare
    .goto(colorURL)
    .evaluate(clearLocalStorage)

  const fullNightmare = pieceObjects.reduce( (nightmare, pieceObject) => {
    // go to the url, type in the quantity, get lowest price
    // select 'view all colors', type in the quantity, get lowest price
    // return {name, color_price, lowest_price}
    return nightmare
      .goto(pieceObject.href)
      .evaluate( addToLocalStorage, {pieceObject, isColor: true})
      .click('div#item-right p a:nth-child(1)')
      .evaluate( addToLocalStorage, {pieceObject, isColor: false})
  }, reduceNightmare);

  fullNightmare
    .evaluate( pullFromLocalStorage )
    .end()
    .then( (localStorageObject) => {console.log(localStorageObject)} )
}

Nightmare({ show: false, dock: false })
  .goto(colorURL)
  .evaluate(getPiecesFromPage)
  .end()
  .then(getPriceDifferences)
  .catch(function (error) {
    console.error('Error:', error);
  });

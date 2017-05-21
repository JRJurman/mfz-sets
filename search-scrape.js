const fetch = require('node-fetch');
const htmlparser = require('htmlparser');
const readline = require('readline');

const brickOwl = 'http://www.brickowl.com';
const mfzWishlistURL = `${brickOwl}/wishlist/view/BrickTiger/mobile-frame-zero-garage-kit-for-brickowl`;
// if a set has less than this many of a pieces, ignore
// make this less than one to accept parital quantities
// make this larger than one to only accept extras
const requiredPercent = 0.5;
// if a set has less than this many types of pieces, ignore
const requiredNumOfPieces = 14;

async function getWishlistParts(wishlistURL) {
  // get wishlist html
  const wishlistResponse = await fetch(wishlistURL);
  const wishlistHTML = await wishlistResponse.text();

  // parse function to get all the pieces from the HTML
  const piecePromise = () => new Promise( (resolve, reject) => {
    const getPieceDoms = new htmlparser.DefaultHandler((error, dom) => {
      if (error) { console.log(error); return reject(); }
      const grid = htmlparser.DomUtils.getElements({ 'class': 'category-grid'}, dom)[0];
      const pieces = grid.children
        .filter( child => child.name === 'li' )
        .map( child => {
          return {
            name: child.children[1].attribs.title,
            originalURL: `${brickOwl}${child.children[1].attribs.href}`,
            comesinURL: `${brickOwl}${child.children[1].attribs.href}/comesin`,
            quantity: parseInt(child.children[5].children[0].data.split(' ').slice(-1), 10)
          }
        });
      resolve(pieces);
    });

    const parser = new htmlparser.Parser(getPieceDoms);
    parser.parseComplete(wishlistHTML);
  });

  const resolvedPieces = await piecePromise();
  return resolvedPieces;
}

async function getSets(pieceComesInURL) {
  // get comesin html
  const comesinResponse = await fetch(pieceComesInURL);
  const comesinHTML = await comesinResponse.text();

  // parse function to get all the sets from the HTML
  const setPromise = () => new Promise( (resolve, reject) => {
    const getSetDoms = new htmlparser.DefaultHandler((error, dom) => {
      if (error) { console.log(error); return reject(); }
      const table = htmlparser.DomUtils.getElementsByTagName('tbody', dom)[0];
      const sets = table.children
        .filter( row => row.type === 'tag' )
        .filter( row => row.children.length === 5 )
        .map( row => {
          return {
            name: row.children[2].children[0].children[0].children[0].data,
            quantity: parseInt(row.children[0].children[0].data)
          }
        })
      resolve(sets)
    });

    const parser = new htmlparser.Parser(getSetDoms);
    parser.parseComplete(comesinHTML);
  });

  const resolvedSets = await setPromise();
  return resolvedSets;
}

async function getAllSets(wishListURL) {
  const pieceObjects = await getWishlistParts(wishListURL);

  // for each piece, get all the sets that have those pieces,
  // and return the number of pieces for that piece in that set
  // i.e. { set1: {piece1: 'qty/req', piece2: 'qty/req'} }

  // using for loop, because it is easier to reason with async / await
  const completeSets = {};
  let pieceIndex = 0;
  for (const pieceObject of pieceObjects) {
    pieceIndex += 1;

    // print a progress marker
    const pieceMarks = '|'.repeat(pieceIndex);
    const pieceUnMarks = '.'.repeat(pieceObjects.length - pieceIndex);
    readline.clearLine(process.stdout);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${pieceMarks}${pieceUnMarks} : PIECE ${pieceObject.name}`)

    const setObjects = await getSets(pieceObject.comesinURL);
    for (const setObject of setObjects) {
      // if we don't have enough in this set, don't even bother
      if (setObject.quantity < pieceObject.quantity*requiredPercent) { continue; }

      // if we already ran into this set, update it
      const newSet = Object.assign(
        {},
        completeSets[setObject.name] || {},
        { [pieceObject.name] : `${setObject.quantity}/${pieceObject.quantity}`}
      );

      Object.assign(completeSets, {
        [setObject.name] : newSet
      });
    }
  }
  return completeSets;
}

getAllSets(mfzWishlistURL, requiredPercent).then(completeSets => {
  const keysToRemove = Object.keys(completeSets).filter(
    setKey => Object.keys(completeSets[setKey]).length < requiredNumOfPieces
  );
  keysToRemove.forEach( key => delete completeSets[key])
  console.log('')
  console.log('------------------------------')
  console.log(completeSets)
  console.log('------------------------------')
});

# MFZ-Sets

Program to pull the Mobile Frame Zero wishlist (or any list on OwlBrick), 
and tell you all the sets that contain a majority of those pieces.

## Usage

Configuration can be found at the top of the file. All you need to do is set
your url, and the number of required types of pieces in a set, and the number
of required pieces compared to the wishlist. After setting the configs, run
```
node search-scrape.js
```

## Requirements

This project uses async / await, which currenlty only works on Node 7.
You can look up instructions on how to install that for your system.

To install the dependencies, just run
```
npm install
```
in the root directory, and you should be all set!

/******************************************************************************

  This is a binary tree based bin packing algorithm that is suitable
  for packing a large number of rectangles into a series of pages.

  This algorithm is based on the article here:
  http://www.blackpawn.com/texts/lightmaps/

  It is an algorithm that has been used in commercial shipping applications.

  Author: Jake Gordon, jake@codeincomplete.com

******************************************************************************/

var Packer = function(w, h) {
  this.init(w, h);
};

Packer.prototype = {

  init: function(w, h) {
    this.root = { x: 0, y: 0, w: w, h: h };
  },

  fit: function(blocks) {
    var n, node, block;
    for (n = 0; n < blocks.length; n++) {
      block = blocks[n];
      if (node = this.findNode(this.root, block.w, block.h)) {
        block.fit = this.splitNode(node, block.w, block.h);
      }
    }
  },

  findNode: function(root, w, h) {
    if (root.used)
      return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
    else if ((w <= root.w) && (h <= root.h))
      return root;
    else
      return null;
  },

  splitNode: function(node, w, h) {
    node.used = true;
    node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
    node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
    return node;
  }

}

/*
File: mgraphics_image_rendering.js

Author: Tyler Mazaika

Date: 2024-03-29

------------------------------------------------------------------------------------------------------------

Demonstrates how to use Image() with scale() in mgraphics to improve drawing performance while preserving high quality drawing on different display pixel densities (DPI -- Dots Per Inch).

Without using scale(), Image() anti-aliasing is lost on higher DPI displays.

"direct_draw <bool>" message can be sent to perform the same drawing code directly into mgraphics for comparison purposes.



NOTE: Color selection in this code uses Live Theme colors accessors only available since Max 8.6.0.

------------------------------------------------------------------------------------------------------------
*/

inlets=1
outlets=2

mgraphics.init()
mgraphics.autofill = 0
mgraphics.relative_coords = 0

// Store the drawn Image between calls to paint().
var cachedImg = null

// The scale factor use for the cached Image()
var imgScale = 2

// mouseover bool
var idle = 0

// Allows comparing drawing results from the Image() and from drawing directly into mgraphics.
var useImage = 1




function paint() {
	with (mgraphics) {

		// A background just to demonstrate between the drawing of cached and the regular mgraphics context drawing
		rectangle(0,0,size[0],size[1])
		set_source_rgba( max.getcolor("live_lcd_bg") )
		fill()


		if ( useImage ) {
			

			/****************************************************************************************
			Image drawing/scaling.
			*****************************************************************************************/


			if ( ! cachedImg ) {
				// If there is no cachedImg we will redraw one in a non-visible MGraphics context and then store it as an Image object.

				// Make the new MGraphics context.  We're setting the size based on the main mgraphics visible size, but "upscaled" by imgScale.  IMPORTANT: If the size of this MGraphics context is not upscaled (e.g. based on mgraphics.size itself), then when we create the Image() object the Image will appear cropped.
				var tmp_mg = new MGraphics( mgraphics.size[0] * imgScale, mgraphics.size[1] * imgScale )
				
				// Scale the drawing commands up for the tmp_mg context.
				tmp_mg.scale(imgScale, imgScale)
				
				// Do the "complex" drawing into the tmp_mg context.
				drawStuff(tmp_mg)

				// Once the drawing is done, store it by making a new Image() object from the tmp_mg context.
				cachedImg = new Image(tmp_mg)
			}

			// Invert the upscaled amount to shrink the Image into the expected size.
			scale( 1/imgScale, 1/imgScale )	

			// Draws the cachedImg at the current origin (0,0 by default).
			image_surface_draw( cachedImg )

			// Since we may do drawing later we want to undo the scale() call above.
			identity_matrix()  // ALTERNATIVELY:  scale( imgScale, imgScale )


			/****************************************************************************************
			End Image drawing/scaling.
			*****************************************************************************************/


		} else {

			// Do the "complex" drawing directly into the screen mgraphics context.  No scaling is required to get anti-aliased text.
			drawStuff(mgraphics)
		}


		// Other drawing can be done on top of the image.
		if ( idle ) {

			// Makes a little indicator when the mouse is over this jsui.
			var r_size = 5
			set_source_rgba( max.getcolor("live_active_automation") )
			rectangle( size[0]-2*r_size, (size[1]-r_size)/2, r_size, r_size )
			fill()
		}


		// Show when normal drawing happens
		outlet(0, "bang")
	}
}




/*
Sample drawing code.

Note that all the pixel / font sizes can be expressed in their normal 1x-scale values.
*/
function drawStuff( mgraphics_context ) {

	// Using an mgraphics_context argument means we can call this same drawing code when drawing into both the onscreen and offscreen mgraphics contexts.
	
	with (mgraphics_context) {

		/*
		Because we can set scale() on mgraphics_context outside this function, for any drawing based on the geometry of the screen mgraphics context we should refer to the size property of the screen mgraphics directly.  

		If we instead used mgraphics_context.size, we could effectively be applying the scaling twice: Once by scaling the offscreen context's size, and again by calling scale() within that context.
		*/
		var _size = mgraphics.size


		// Rectangle Frame

		set_line_width(1)


		////////// IMPORTANT: if we will modify the transform matrix inside drawStuff(), then to return to the original state we DON'T want to use identity_matrix(), since it also would reset the scale() setting.  So instead, use get_matrix() and set_matrix().
		var mtx = get_matrix()


		// On 1x scale displays, thin lines (e.g. 1px) render best when they are offset by a half-pixel.  NOTE: Using translate() here is to justify demonstration of the get_matrix()/set_matrix() pairing.
		translate(1.5, 1.5)


		// Make a rectangle based on the size of the screen/main mgraphics context.
		rectangle(0, 0, _size[0]-3, _size[1]-3)
		set_source_rgba( max.getcolor("live_lcd_bg") )
		fill_preserve()
		set_source_rgba( max.getcolor("live_lcd_control_fg") )
		stroke()


		////////// Restores the matrix to whatever it was prior to translate(1.5, 1.5) above.
		set_matrix(mtx)


		// Text

		var str = "A quick brown fox jumps over the lazy dog."
		select_font_face("Ableton Sans Medium")
		set_font_size(10)

		var txtsize = text_measure(str)
		move_to( 5, (_size[1] + txtsize[1]/2)/2 )
		set_source_rgba( max.getcolor("live_lcd_control_fg_alt"))
		show_text(str)
	}

	// Show when this drawing code is executed.
	outlet(1, "bang")
}





/*
Change the Image scaling factor.
*/
function msg_float(v) {
	// Constrain drawing scale
	imgScale = Math.max(0.125, Math.min(8,v))
	// Dispose of cachedImg to force making a new Image
	cachedImg = null
	mgraphics.redraw()
}

function msg_int(v) {
	msg_float(v)
}



/*
Force a redraw.  Useful in case [live.colors] changes color values, for example, since Live Theme colors are used in drawStuff()
*/
function bang() {
	cachedImg = null
	mgraphics.redraw()
}



/*
Show / Hide an indicator on hover.
*/
function onidle() {
	idle = 1
	mgraphics.redraw()
}
function onidleout() {
	idle = 0
	mgraphics.redraw()
}


function direct_draw(v) {
	useImage = parseInt(v) == 0
	cachedImg = null
	mgraphics.redraw()
}
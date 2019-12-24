var dragItem = document.querySelector("#mapSelector");
var container = document.querySelector(".minimap svg");
var maximap = document.querySelector(".maximap svg");
var zoomInButton = document.querySelector("#zoomIn");
var zoomOutButton = document.querySelector("#zoomOut");

var active = false;
var currentX;
var currentY;

const zoomScale = 1.5;

container.addEventListener("mousedown", dragStart, false);
container.addEventListener("mouseup", dragEnd, false);
container.addEventListener("mousemove", drag, false);

zoomInButton.addEventListener("click", zoomIn);
zoomOutButton.addEventListener("click", zoomOut);

function dragStart(e) {
	currentX = e.clientX;
	currentY = e.clientY;

	if (e.target === dragItem) {
		active = true
	}
}

function dragEnd(e) {
	active = false;
}

function drag(e) {
	if (active) {
		e.preventDefault();
		move(e);
		currentX = e.clientX;
		currentY = e.clientY;
	}
}

function move(e) {
	var movedX = e.clientX - currentX;
	var movedY = e.clientY - currentY;
	var movedSvgX = movedX * computeSvgRatioHeight(container);
	var movedSvgY = movedY * computeSvgRatioWidth(container);

	newSvgX = +dragItem.getAttribute("x") + movedSvgX;
	newSvgY = +dragItem.getAttribute("y") + movedSvgY;
	dragItem.setAttribute("x", newSvgX);
	dragItem.setAttribute("y", newSvgY);
	maximap.viewBox.baseVal.x = newSvgX;
	maximap.viewBox.baseVal.y = newSvgY;
}

function computeSvgRatioHeight(svg) {
	var svgHeight = svg.clientHeight;
	var svgViewHeight = svg.viewBox.baseVal.height;
	return svgViewHeight / svgHeight
}

function computeSvgRatioWidth(svg) {
	var svgWidth = svg.clientWidth;
	var svgViewWidth = svg.viewBox.baseVal.width;
	return svgViewWidth / svgWidth
}

function zoomIn(e) {
	zoom(x => x / zoomScale)
}

function zoomOut(e) {
	zoom(x => x * zoomScale)
}

function zoom(scaleBy) {
	zoomMini(scaleBy);
	zoomMaxi(scaleBy);
}

function zoomMini(scaleBy) {
	var currHeight = +dragItem.getAttribute("height");
	var newHeight = scaleBy(currHeight);
	var currWidth = +dragItem.getAttribute("width");
	var newWidth = scaleBy(currWidth);
	dragItem.setAttribute("x", 0.5 * (currHeight - newHeight) + +dragItem.getAttribute("x"));
	dragItem.setAttribute("y", 0.5 * (currWidth - newWidth) + +dragItem.getAttribute("y"));
	dragItem.setAttribute("height", newHeight);
	dragItem.setAttribute("width", newWidth);
}

function zoomMaxi(scaleBy) {
	var currHeight = maximap.viewBox.baseVal.height;
	var newHeight = scaleBy(currHeight);
	var currWidth = maximap.viewBox.baseVal.width;
	var newWidth = scaleBy(currWidth);
	maximap.viewBox.baseVal.x = dragItem.getAttribute("x");
	maximap.viewBox.baseVal.y = dragItem.getAttribute("y");
	maximap.viewBox.baseVal.height = newHeight;
	maximap.viewBox.baseVal.width = newWidth;
}

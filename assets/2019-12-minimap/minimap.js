var dragItem = document.querySelector("#mapSelector");
var container = document.querySelector(".minimap svg");
var maximap = document.querySelector(".maximap svg");

var active = false;
var currentX;
var currentY;

container.addEventListener("mousedown", dragStart, false);
container.addEventListener("mouseup", dragEnd, false);
container.addEventListener("mousemove", drag, false);

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
		moveBy(e);
		currentX = e.clientX;
		currentY = e.clientY;
	}
}

function moveBy(e) {
	var movedX = e.clientX - currentX;
	var movedY = e.clientY - currentY;
	var currentSvgX = +dragItem.getAttribute("x");
	var currentSvgY = +dragItem.getAttribute("y");
	var miniSvgRatioHeight = computeSvgRatioHeight(container);
	var miniSvgRatioWidth = computeSvgRatioWidth(container);
	var movedSvgX = movedX * miniSvgRatioHeight;
	var movedSvgY = movedY * miniSvgRatioWidth;
	currentSvgX = currentSvgX + movedSvgX;
	currentSvgY = currentSvgY + movedSvgY;
	dragItem.setAttribute("x", currentSvgX);
	dragItem.setAttribute("y", currentSvgY);
	maximap.viewBox.baseVal.x = currentSvgX;
	maximap.viewBox.baseVal.y = currentSvgY;
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

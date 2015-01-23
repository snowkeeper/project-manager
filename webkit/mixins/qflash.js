var React =  require('react');

var QFlash;
module.exports = QFlash = {
    
    qFlashRender: function () {
        
        return (
			<div className="flash-messages" >
				<div style="display:none;" class="fademessage">
					<div class="html"></div>
					<div onClick="snowUI.killFlash('message')" class="killfademessage">
						<button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
					</div>
				</div>
				<div style="display:none;" class="fadeloadingmessage">
					<div class="html"></div>
					<div onClick="snowUI.killFlash('loadingmessage')" class="killfademessage">
						<button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
					</div>
				</div>
				<div class="fadesuccess">
					<div class="html"></div>
					<div onClick="snowUI.killFlash('success')" class="killfademessage">
						<button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
					</div>
				</div>
				<div style="display:none;" class="fadeerror">
					<div class="html"></div>
					<div onClick="snowUI.killFlash('error')" class="killfademessage">
						<button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
					</div>
				</div>
			</div>
		);
    }
}

/* {[The file is published on the basis of YetiForce Public License 3.0 that can be found in the following directory: licenses/LicenseEN.txt or yetiforce.com]} */
$.Class("Base_RecordsList_JS", {}, {
	/**
	 * Event for select row
	 */
	selectEvent: false,
	/**
	 * List search instance
	 */
	listSearchInstance: false,
	/**
	 * Module name
	 */
	moduleName: false,
	/**
	 * Modal container
	 */
	container: false,
	/**
	 * Set event for select row
	 * @param {function} cb
	 */
	setSelectEvent: function (cb) {
		this.selectEvent = cb;
	},
	/**
	 * Get params for record list
	 * @returns {{module: string, view: string, src_module: string, src_record: int, src_field: string, related_parent_module: string, related_parent_id: int|string, page: int, orderby: string, sortorder: string, multi_select: boolean, totalCount: int|string, noOfEntries: int, onlyBody: boolean}}
	 */
	getParams: function () {
		let params = {
			module: this.moduleName,
			view: this.container.data('view'),
			src_module: this.container.find('.js-parent-module').val(),
			src_record: this.container.find('.js-source-record').val(),
			src_field: this.container.find('.js-source-field').val(),
			related_parent_module: this.container.find('.js-related-parent-module').val(),
			related_parent_id: this.container.find('.js-related-parent-id').val(),
			page: this.container.find('.js-page-number').val(),
			orderby: this.container.find('.js-order-by').val(),
			sortorder: this.container.find('.js-sort-order').val(),
			multi_select: this.container.find('.js-multi-select').val(),
			totalCount: this.container.find('.js-total-count').val(),
			noOfEntries: this.container.find('.js-no-entries').val(),
			onlyBody: true
		}
		let searchValue = this.listSearchInstance.getAlphabetSearchValue();
		params['search_params'] = JSON.stringify(this.listSearchInstance.getListSearchParams(true));
		if ((typeof searchValue !== "undefined") && (searchValue.length > 0)) {
			params['search_key'] = this.listSearchInstance.getAlphabetSearchField();
			params['search_value'] = searchValue;
			params['operator'] = 's';
		}
		return params;
	},
	/**
	 * Load records list
	 * @param {object} params
	 * @returns {*}
	 */
	loadRecordList: function (params) {
		const body = this.container.find('.js-modal-body')
		const aDeferred = $.Deferred();
		const progressIndicatorElement = $.progressIndicator({
			blockInfo: {
				enabled: true,
				elementToBlock: body
			}
		});
		AppConnector.request($.extend(this.getParams(), params)).then((responseData) => {
			progressIndicatorElement.progressIndicator({mode: 'hide'});
			body.html($(responseData).html());
			this.registerBasicEvents();
			aDeferred.resolve(responseData);
		}, function (textStatus, errorThrown) {
			aDeferred.reject(textStatus, errorThrown);
			progressIndicatorElement.progressIndicator({mode: 'hide'});
		});
		return aDeferred.promise();
	},
	/*
	 * Register the click event for listView headers
	 */
	registerHeadersClickEvent: function () {
		const thisInstance = this;
		this.container.on('click', '.js-change-order', function (e) {
			e.preventDefault();
			const element = $(this);
			if (typeof element.data('nextOrder') === 'undefined') {
				return;
			}
			thisInstance.loadRecordList({
				orderby: element.data('name'),
				sortorder: element.data('nextOrder')
			});
		});
	},
	/**
	 * Update record pagination
	 * @param {boolean} countNumberRecords
	 */
	updatePagination: function (countNumberRecords) {
		const thisInstance = this;
		let params = this.getParams();
		params['mode'] = 'getPagination';
		if (countNumberRecords) {
			params['showTotalCount'] = true;
		}
		AppConnector.request(params).then((responseData) => {
			this.container.find('.js-pagination-container').html(responseData);
			let totalCount = this.container.find('.js-pagination-list').data('totalCount')
			if (totalCount) {
				this.container.find('.js-total-count').val(totalCount);
			}
			thisInstance.registerPaginationEvents();
		});
	},
	/**
	 * Register pagination events
	 */
	registerPaginationEvents: function () {
		const thisInstance = this;
		this.container.find('.js-next-page').on('click', function () {
			if ($(this).hasClass('disabled')) {
				return;
			}
			if (thisInstance.container.find('.js-no-entries').val() == thisInstance.container.find('.js-page-limit').val()) {
				let pageNumber = thisInstance.container.find('.js-page-number');
				let nextPageNumber = parseInt(parseFloat(pageNumber.val())) + 1;
				pageNumber.val(nextPageNumber)
				thisInstance.loadRecordList().then(function () {
					thisInstance.updatePagination();
				});
			}
		});
		this.container.find('.js-previous-page').on('click', function () {
			let pageNumber = thisInstance.container.find('.js-page-number');
			if (pageNumber.val() > 1) {
				let nextPageNumber = parseInt(parseFloat(pageNumber.val())) - 1;
				pageNumber.val(nextPageNumber)
				thisInstance.loadRecordList().then(function () {
					thisInstance.updatePagination();
				});
			}
		});
		this.container.find('.js-set-page').on('click', function () {
			if ($(this).hasClass('disabled')) {
				return;
			}
			thisInstance.container.find('.js-page-number').val($(this).data("id"));
			thisInstance.loadRecordList().then(function () {
				thisInstance.updatePagination();
			});
		});
		this.container.find('.js-count-number-records').on('click', function () {
			app.hidePopover($(this));
			Vtiger_Helper_Js.showMessage({
				title: app.vtranslate('JS_LBL_PERMISSION'),
				text: app.vtranslate('JS_GET_PAGINATION_INFO'),
				type: 'info',
			});
			thisInstance.updatePagination(true);
		});
		this.container.find('.js-page-jump-drop-down').on('click', 'li', function (e) {
			e.stopImmediatePropagation();
		}).on('keypress', '.js-page-jump', function (e) {
			if (e.which == 13) {
				e.stopImmediatePropagation();
				const element = $(this);
				const response = Vtiger_WholeNumberGreaterThanZero_Validator_Js.invokeValidation(element);
				if (typeof response != "undefined") {
					element.validationEngine('showPrompt', response, '', "topLeft", true);
				} else {
					element.validationEngine('hideAll');
					let pageNumber = thisInstance.container.find('.js-page-number');
					let currentPageNumber = pageNumber.val();
					let newPageNumber = parseInt($(this).val());
					var totalPages = parseInt(thisInstance.container.find('.js-total-page').text());
					if (newPageNumber > totalPages) {
						var error = app.vtranslate('JS_PAGE_NOT_EXIST');
						element.validationEngine('showPrompt', error, '', "topLeft", true);
						return;
					}
					if (newPageNumber == currentPageNumber) {
						Vtiger_Helper_Js.showMessage({
							text: app.vtranslate('JS_YOU_ARE_IN_PAGE_NUMBER') + " " + newPageNumber,
							type: 'info'
						});
						return;
					}
					pageNumber.val(newPageNumber);
					thisInstance.loadRecordList().then(function () {
						thisInstance.updatePagination();
					});
				}
			}
		});
	},
	/**
	 * Register list search
	 */
	registerListSearch: function () {
		this.listSearchInstance = YetiForce_ListSearch_Js.getInstance(this.container, false, this, this.moduleName);
		this.listSearchInstance.setViewName('RecordsList');
	},
	/**
	 * Register list events
	 */
	registerListEvents: function () {
		var thisInstance = this;
		thisInstance.container.on('click', '.js-select-row', function (e) {
			app.hideModalWindow(false, thisInstance.container.parent().attr('id'));
			let row = $(this);
			thisInstance.selectEvent(row.data());
		});
		thisInstance.container.on('change', '.js-hierarchy-records', function () {
			thisInstance.container.find('.js-related-parent-id').val(this.value);
			thisInstance.loadRecordList().then(function () {
				thisInstance.updatePagination();
			});
		});
	},
	/**
	 * Register modal basic events
	 */
	registerBasicEvents: function () {
		this.registerListSearch();
		this.registerPaginationEvents();
	},
	/**
	 * Register modal events
	 * @param {jQuery} modalContainer
	 */
	registerEvents: function (modalContainer) {
		this.container = modalContainer;
		this.moduleName = this.container.data('module');
		this.registerBasicEvents();
		this.registerListEvents();
		this.registerHeadersClickEvent();
	}
});
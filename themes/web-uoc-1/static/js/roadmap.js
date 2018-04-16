var orders = {
  setted : {},
  get:function(l){
    var letters = ["A","B","C","D","E","F","G","H"]
    if(!this.setted[l]){
      for(var i=0,z=letters.length;i<z;i++){
        if(letters[i]==l){
          this.setted[l]=i;
          break;
        }
      }
    }
    return parseInt(this.setted[l]);
  }
}

function getCellStyle(r,c,m){
  var cellstyle = "";
  if(c===0){
    cellstyle="border-bottom:1px solid #fff;";
  }
  if(c===0 && m[r][c]){
    cellstyle+="border-top:4px solid #73edff;";
  }

  return "style=\""+cellstyle+"\"";
}

function processSheetJSON(results,tableId, chartId, callback){
    $("<table id='roadmap_table' class='table'></table>").appendTo("#roadmap");

    var matrix = [],col,row;

    for(var i=0,z=results.feed.entry.length;i<z;i++){
      col = results.feed.entry[i].title.$t.slice(0,1);
      col = orders.get(col);
      row = parseInt(results.feed.entry[i].title.$t.slice(1));
      if(!matrix[row]){
        matrix[row]=[];
      }
      matrix[row][col]=results.feed.entry[i].content.$t;
    }
   
    var max_cols = 6;	

      $("<thead></thead>").appendTo("#roadmap_table");
      $("<tbody></tbody>").appendTo("#roadmap_table");

    for(var i=1;i<matrix.length;i++){
        if(i===1){
          $("<tr></tr>").appendTo("#roadmap_table thead");
        }else{
          $("<tr></tr>").appendTo("#roadmap_table tbody");
        }
      
        $("<tr></tr>").appendTo("#roadmap_table");
        for(var k=0,y=matrix[i].length;k<y && k<max_cols;k++){
          $("<td "+getCellStyle(i,k,matrix)+">"+(matrix[i][k]?matrix[i][k]:"")+"</td>").appendTo("#roadmap_table tr:last");	
        }

		if(k<max_cols){
          for(;k<max_cols;k++){ 
              $("<td "+getCellStyle(i,k,matrix)+"></td>").appendTo("#roadmap_table tr:last");	
          }
        }
    }

    if(callback){
      callback();
    }
}
 
	$(function() {
  		$.getJSON("https://spreadsheets.google.com/feeds/cells/1W4JoduLQWFInGB0peOYOu2eWgYyTpNco3Ri9_qmBm1Y/7/public/basic?alt=json-in-script&callback=?", null, function(results){
	    processSheetJSON(results,"browsers1", "chart1", function(){
    });
  });
});
# Contributors Guide

## General Guidelines

We love contributions and need them to ensure the textbook is a high-quality resource. 
To avoid duplication of effort and to ensure all discussion happens in the same place, 
always check the existing issues and pull requests to see if the problem has already been addressed. 
It is worth removing the `is:open` filter to search through closed / merged issues too.

- If you notice any spelling / grammar erros and want to fix them, then feel free to go ahead and make a pull request. 
- If you want to correct a scientific / mathematical / code error, make an issue first so we can discuss the changes.
- Please make one pull request (using separate branches) for each issue.

If you want to contribute original content, there are a few things you can do to make sure your efforts have the biggest impact:

- Please open an issue explaining your proposed additions. Here we can discuss where your contribution will fit in, as well as making sure it fits the style and format of the rest of the textbook.
- Create a pull request while your chapter is in progress, this way we can review it in the process of writing instead of asking for large changes after you have already written it.
- Try to follow the formatting and tone of the existing notebooks to ensure everything renders correctly and the textbook is coherent. 

## How to Edit the Textbook

The textbook uses jupyter book to generate the site from jupyter notebooks. To edit the pages you will first need to install jupyter and Qiskit, you can use the links below to help you do this:

- [Install Qiskit](https://qiskit.org/documentation/install.html)
- [Install Jupyter](https://jupyter.org/install)

If you are unfamiliar with git, you can follow this guide to making contributions:

- [Github Desktop Tutorial](https://github.com/firstcontributions/first-contributions/blob/master/github-desktop-tutorial.md)

You will need to fork the textbook, make changes in your own branch, then submit a pull request which we will review before merging. You must use jupyter notebook to edit the pages. If you change any code, please re-run the notebook (you can do this using the ⏭  button at the top of the notebook editor) to update the cell outputs.

**Important:** The notebooks to edit are inside the `content` folder.

## Tags in Qiskit Textbook Notebooks

After writing your chapter, you must add a few tags to your cells (You can see the tags using `view > tags`).

- If you include the chapter's title in your notebook, move this to its own cell and add a `remove_cell` tag to avoid duplicate titles on the website. This is only for the title that will appear in the sidebar.
- If you intentionally raise an exception in a cell, add a `raises-exception` tag to that code cell so our checking script knows this is intentional.
- Any code cell that uses IBM hardware, or relies on the results from such a cell needs a `uses-hardware` tag to alert the user this cannot be run on the website through [thebelab](https://thebelab.readthedocs.io/en/latest/).
- When creating graphs, you can hide the code that generated your graph on the website using the `remove_input` tag. The code and graph will not be interactive, essentially embedding a static image. The pro is that this enables future editors to modify it.
- Finally, after adding these tags, go to `view > none` and save your notebook to stop the tags from showing automatically when a reader opens the notebook.

For a list of contributors, see the [.bib](https://github.com/qiskit-community/qiskit-textbook/blob/master/content/qiskit-textbook.bib) file.

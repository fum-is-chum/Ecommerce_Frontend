import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxFileUploadStorage } from '@ngx-file-upload/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { AlertService } from 'app/shared/service/alert/alert.service';
import { ProductService } from 'app/main/apps/products/service/product.service';
import { Product } from 'app/main/apps/products/model/product.viewmodel';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { ProductsComponent } from '../../pages/product-data/products.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  @Input() data: Product
  
  ProductViewModel = new Product();
  image: any;

  public ProductForm: FormGroup
  public submitted: boolean = false;
  public ColumnMode = ColumnMode;
  public storage: NgxFileUploadStorage;
  public imagePath: any = '';
  
  constructor(
    private _productService: ProductService,
    private _formBuilder: FormBuilder,
    private _alertService: AlertService,
    private _parentComponent: ProductsComponent
  ) {
    this.ProductForm = this.createProductForm(this.ProductViewModel);
  }

  drop(file: NgxFileDropEntry[]) {
    let sources: File;
    const reader = new FileReader();
    if (file[0].fileEntry.isFile) {
      const dropped: any = file[0].fileEntry;
      dropped.file((droppedFile: File) => {
        if (droppedFile instanceof DataTransferItem) {
          return;
        }
        this.image = droppedFile
        reader.readAsDataURL(droppedFile)
        reader.onload = () => {
          this.imagePath = reader.result;
        };
      });
    }
  }

  ngOnInit(): void {
    this._productService.getProductById(this.data.productId).subscribe((resp) => {
      // console.log(resp)
      this.ProductViewModel = resp.product
      this.ProductForm.patchValue(this.ProductViewModel)
      if(this.ProductViewModel.beforeDiscount){
        this.ProductForm.patchValue({
          productPrice: this.ProductViewModel.beforeDiscount
        })
      }
      this.imagePath = `http://localhost:5000/${this.ProductForm.value.product_galleries[0].imagePath}`;
      // console.log(this.ProductForm.value)
    })
  }

  ngOnDestroy() {
  }

  get f() {
    return this.ProductForm.controls;
  }

  createProductForm(data: Product): FormGroup {
    return this._formBuilder.group({
      productId: [data.productId],
      productName: [data.productName, [Validators.required]],
      productSummary: [data.productSummary, [Validators.required]],
      productCategory: [data.productCategory, [Validators.required]],
      productDesc: [data.productDesc, [Validators.required]],
      productBrand: [data.productBrand, [Validators.required]],
      productPrice: [data.productPrice, [Validators.min(0)]],
      productStock: [data.productStock, [Validators.min(0)]],
      product_galleries: []
    })
  }

  onDelete(): void {
    try{
      this._productService.deleteProduct(this.f.productId.value).subscribe((resp) => {
        console.log(resp)
      },(err) => {
        console.log(err)
      })
    } catch(e){
      console.log(e)
    }
  }

  confirmDelete() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Confirm action',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-outline-primary ml-1'
      }
    }).then((result) => {
      if (result.value) {
        this._productService.deleteProduct(this.f.productId.value).subscribe((resp) => {
          if(resp?.message === 'Product Deleted'){
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Product deleted!',
              customClass: {
                confirmButton: 'btn btn-primary'
              }
            });

            this._parentComponent.loadProducts();
          }
        },(err) => {
          console.log(err)
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: err,
            customClass: {
              confirmButton: 'btn btn-primary'
            }
          });
        })
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.ProductForm.invalid) {
      return;
    }
    const data = this.ProductForm.getRawValue()
    this._productService.updateProduct(data).subscribe((resp) => {
      if(resp.message === "Product Updated"){
        this.submitted = false;
        this._parentComponent.loadProducts();
        // console.log(this._parentComponent.productList)
        this._alertService.toastrSuccess(resp.message,2000, { hr: 'center', vr: 'top'})
      }
    },(err) => {
      console.log(err)
    })
  }
}